import { useRef, useCallback, useEffect } from "react";

function editorLineHeight(textarea) {
  const style = getComputedStyle(textarea);
  const lh = parseFloat(style.lineHeight);
  if (Number.isFinite(lh) && lh > 0) return lh;
  const fs = parseFloat(style.fontSize) || 14;
  return fs * 1.55;
}

function editorPaddingTop(textarea) {
  return parseFloat(getComputedStyle(textarea).paddingTop) || 0;
}

/** 1-based line currently at the top of the editor viewport */
export function lineFromEditor(textarea) {
  if (!textarea) return 1;
  const lh = editorLineHeight(textarea);
  const pad = editorPaddingTop(textarea);
  return Math.max(1, Math.floor((textarea.scrollTop - pad) / lh) + 1);
}

export function scrollEditorToLine(textarea, line) {
  if (!textarea) return;
  const lh = editorLineHeight(textarea);
  const pad = editorPaddingTop(textarea);
  const max = textarea.scrollHeight - textarea.clientHeight;
  textarea.scrollTop = Math.max(0, Math.min(max, pad + (line - 1) * lh));
}

function anchorsIn(body) {
  if (!body) return [];
  return [...body.querySelectorAll("[data-line]")].sort(
    (a, b) =>
      parseInt(a.getAttribute("data-line"), 10) -
      parseInt(b.getAttribute("data-line"), 10)
  );
}

/**
 * Scroll preview viewport so content for `line` sits near the top.
 * Interpolates between neighbouring source anchors for smoother tracking.
 */
export function scrollPreviewToLine(viewport, body, line) {
  if (!viewport || !body) return;
  const anchors = anchorsIn(body);
  if (!anchors.length) return;

  let i = 0;
  while (
    i + 1 < anchors.length &&
    parseInt(anchors[i + 1].getAttribute("data-line"), 10) <= line
  ) {
    i += 1;
  }

  const cur = anchors[i];
  const next = anchors[i + 1];
  const lineStart = parseInt(cur.getAttribute("data-line"), 10);
  const lineEnd = next
    ? parseInt(next.getAttribute("data-line"), 10)
    : lineStart + Math.max(1, Math.round(cur.offsetHeight / 20));

  const frac =
    lineEnd > lineStart
      ? Math.max(0, Math.min(1, (line - lineStart) / (lineEnd - lineStart)))
      : 0;

  const y0 = cur.offsetTop;
  const y1 = next ? next.offsetTop : y0 + cur.offsetHeight;
  const y = y0 + (y1 - y0) * frac;

  const max = viewport.scrollHeight - viewport.clientHeight;
  viewport.scrollTop = Math.max(0, Math.min(max, y - 4));
}

/** Infer source line from preview scroll position via data-line anchors */
export function lineFromPreview(viewport, body) {
  if (!viewport || !body) return 1;
  const anchors = anchorsIn(body);
  if (!anchors.length) return 1;

  const y = viewport.scrollTop + 4;
  let i = 0;
  while (i + 1 < anchors.length && anchors[i + 1].offsetTop <= y) {
    i += 1;
  }

  const cur = anchors[i];
  const next = anchors[i + 1];
  const lineStart = parseInt(cur.getAttribute("data-line"), 10);
  const lineEnd = next
    ? parseInt(next.getAttribute("data-line"), 10)
    : lineStart + 10;

  const y0 = cur.offsetTop;
  const y1 = next ? next.offsetTop : y0 + cur.offsetHeight;
  const frac = y1 > y0 ? Math.max(0, Math.min(1, (y - y0) / (y1 - y0))) : 0;

  return Math.max(1, Math.round(lineStart + (lineEnd - lineStart) * frac));
}

/**
 * Bidirectional content-based scroll sync between editor textarea and
 * preview ScrollArea viewport. Aligns by markdown source line, not pane %.
 */
export function useScrollSync({ editorRef, previewBodyRef, previewViewportRef, enabled = true }) {
  const lockRef = useRef(null); // 'editor' | 'preview' | null
  const unlockTimer = useRef(null);

  const lock = useCallback((side) => {
    lockRef.current = side;
    clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(() => {
      lockRef.current = null;
    }, 80);
  }, []);

  const onEditorScroll = useCallback(() => {
    if (!enabled) return;
    if (lockRef.current === "preview") return;
    const ta = editorRef.current;
    const vp = previewViewportRef.current;
    const body = previewBodyRef.current;
    if (!ta || !vp || !body) return;
    lock("editor");
    const line = lineFromEditor(ta);
    scrollPreviewToLine(vp, body, line);
  }, [enabled, editorRef, previewBodyRef, previewViewportRef, lock]);

  const onPreviewScroll = useCallback(() => {
    if (!enabled) return;
    if (lockRef.current === "editor") return;
    const ta = editorRef.current;
    const vp = previewViewportRef.current;
    const body = previewBodyRef.current;
    if (!ta || !vp || !body) return;
    lock("preview");
    const line = lineFromPreview(vp, body);
    scrollEditorToLine(ta, line);
  }, [enabled, editorRef, previewBodyRef, previewViewportRef, lock]);

  // Attach preview viewport listener (Mantine viewport is a DOM node)
  useEffect(() => {
    const vp = previewViewportRef.current;
    if (!vp || !enabled) return;
    vp.addEventListener("scroll", onPreviewScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onPreviewScroll);
  }, [previewViewportRef, onPreviewScroll, enabled]);

  useEffect(() => () => clearTimeout(unlockTimer.current), []);

  return { onEditorScroll };
}
