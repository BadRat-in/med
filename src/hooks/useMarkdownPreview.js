import { useState, useEffect, useRef, useCallback } from "react";
import { initMermaid, parseMarkdown, runMermaid } from "../lib/markdown";

/**
 * Per-document preview cache:
 *   docId → { content, html }
 * Tab switches with unchanged content hit the cache immediately (no debounce).
 */
const previewCache = new Map();

export function useMarkdownPreview({ docId, content, live, isDark, enabled }) {
  const [html, setHtml] = useState(() => {
    if (docId && previewCache.has(docId)) {
      const hit = previewCache.get(docId);
      if (hit.content === content && hit.isDark === isDark) return hit.html;
    }
    return "";
  });
  const previewRef = useRef(null);
  const debounceRef = useRef(null);
  const prevDocIdRef = useRef(docId);
  const parseGenRef = useRef(0);

  useEffect(() => {
    initMermaid(isDark);
  }, [isDark]);

  // Invalidate cache entries when theme flips (mermaid SVGs are theme-bound)
  useEffect(() => {
    // Keep content keys but force re-parse on next visit by clearing isDark mismatch
    for (const [id, entry] of previewCache) {
      if (entry.isDark !== isDark) previewCache.delete(id);
    }
  }, [isDark]);

  const finishMermaidAndCache = useCallback(
    async (gen, id, sourceContent) => {
      if (!previewRef.current) return;
      await runMermaid(previewRef.current);
      if (gen !== parseGenRef.current) return; // stale
      // Snapshot fully-rendered HTML (mermaid already replaced with SVG)
      const finalHtml = previewRef.current.innerHTML;
      if (id && sourceContent != null) {
        previewCache.set(id, {
          content: sourceContent,
          html: finalHtml,
          isDark,
        });
      }
    },
    [isDark]
  );

  useEffect(() => {
    if (!enabled) return;

    const switchedTab = prevDocIdRef.current !== docId;
    prevDocIdRef.current = docId;

    // Instant path: cache hit for this doc + content + theme
    if (docId && previewCache.has(docId)) {
      const hit = previewCache.get(docId);
      if (hit.content === content && hit.isDark === isDark) {
        clearTimeout(debounceRef.current);
        setHtml(hit.html);
        return;
      }
    }

    // Editing the same doc → debounce. Switching tabs → parse immediately.
    const delay = switchedTab || !content ? 0 : 220;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!live) return;
      const gen = ++parseGenRef.current;
      try {
        const parsed = parseMarkdown(content || "");
        if (gen !== parseGenRef.current) return;
        setHtml(parsed);
        // Mermaid runs in the effect below after paint
      } catch (err) {
        console.error(err);
      }
    }, delay);

    return () => clearTimeout(debounceRef.current);
  }, [content, docId, live, isDark, enabled]);

  // After HTML is painted, process mermaid then write cache
  useEffect(() => {
    if (!html || !live || !enabled) return;

    // Cache may already contain rendered SVGs — skip mermaid work
    if (docId && previewCache.has(docId)) {
      const hit = previewCache.get(docId);
      if (hit.content === content && hit.isDark === isDark && hit.html === html) {
        return;
      }
    }

    let cancelled = false;
    const gen = parseGenRef.current;

    requestAnimationFrame(() => {
      requestAnimationFrame(async () => {
        if (cancelled || !previewRef.current) return;
        await finishMermaidAndCache(gen, docId, content);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [html, live, enabled, isDark, docId, content, finishMermaidAndCache]);

  return { html, previewRef };
}

/** Optional helper if a doc is closed — free memory */
export function invalidatePreviewCache(docId) {
  if (docId) previewCache.delete(docId);
  else previewCache.clear();
}
