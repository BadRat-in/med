import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Must match EditorPane textarea: fontSize 13.5 * lineHeight 1.55. */
const LINE_H = 13.5 * 1.55;

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegex(query, caseSensitive) {
  if (!query) return null;
  try {
    return new RegExp(escapeRegExp(query), caseSensitive ? "g" : "gi");
  } catch {
    return null;
  }
}

function findMatches(content, query, caseSensitive) {
  const re = buildRegex(query, caseSensitive);
  if (!re || content == null) return [];
  const out = [];
  let m;
  while ((m = re.exec(content))) {
    out.push({ index: m.index, length: m[0].length, text: m[0] });
    if (m[0].length === 0) re.lastIndex++;
  }
  return out;
}

/** Replace every match; returns { text, count }. */
function replaceAllIn(content, query, caseSensitive, replacement) {
  const re = buildRegex(query, caseSensitive);
  if (!re || content == null) return { text: content, count: 0 };
  let count = 0;
  const text = content.replace(re, () => {
    count++;
    return replacement;
  });
  return { text, count };
}

/**
 * Zed-style search & replace state for the editor screen.
 *
 * Modes:
 *  - "current" — find/replace within the active document (⌘F)
 *  - "all"     — find/replace across every open document (⇧⌘F)
 *
 * Owns query/replace inputs, match navigation, and reveal-in-editor
 * scrolling (textarea selection + scrollTop). Docs stay the source of
 * truth for content; replacements write back via setContent/updateDoc.
 */
export function useSearch({ docs, activeDoc, setActiveId, setContent, updateDoc, editorRef }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("current");
  const [query, setQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [current, setCurrent] = useState(0);
  // Pending cross-file jump: reveal once the target doc becomes active
  const pendingJump = useRef(null);

  const matches = useMemo(
    () => findMatches(activeDoc?.content, query, caseSensitive),
    [activeDoc?.content, query, caseSensitive]
  );

  /** Per-doc results for "all" mode: [{ doc, line, column, snippet, matchIndex }] */
  const allResults = useMemo(() => {
    if (mode !== "all" || !query) return [];
    const out = [];
    for (const doc of docs) {
      const ms = findMatches(doc.content, query, caseSensitive);
      ms.forEach((m, i) => {
        const before = doc.content.slice(0, m.index);
        const line = before.split("\n").length - 1;
        const lineStart = before.lastIndexOf("\n") + 1;
        const lineText = doc.content.slice(
          lineStart,
          doc.content.indexOf("\n", m.index) === -1
            ? doc.content.length
            : doc.content.indexOf("\n", m.index)
        );
        out.push({ doc, line, matchIndex: i, snippet: lineText.trim().slice(0, 80) });
      });
    }
    return out;
  }, [mode, docs, query, caseSensitive]);

  const totalAllMatches = allResults.length;

  // Clamp the cursor whenever the match list shrinks (edit/replace)
  useEffect(() => {
    setCurrent((c) => (matches.length ? Math.min(c, matches.length - 1) : 0));
  }, [matches.length]);

  /** Scroll the textarea so the given [start,end) range is visible and selected. */
  const revealInEditor = useCallback(
    (content, start, end) => {
      const ta = editorRef.current;
      if (!ta) return;
      ta.setSelectionRange(start, end);
      const line = content.slice(0, start).split("\n").length - 1;
      ta.scrollTop = Math.max(0, line * LINE_H - ta.clientHeight / 2);
    },
    [editorRef]
  );

  const goTo = useCallback(
    (idx) => {
      if (!matches.length || !activeDoc) return;
      const next = ((idx % matches.length) + matches.length) % matches.length;
      setCurrent(next);
      const m = matches[next];
      revealInEditor(activeDoc.content, m.index, m.index + m.length);
    },
    [matches, activeDoc, revealInEditor]
  );

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  const openSearch = useCallback((m) => {
    setMode(m);
    setOpen(true);
    setCurrent(0);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  /** Jump to a match in any doc; reveal runs after that doc activates. */
  const jumpToResult = useCallback(
    (docId, matchIdx) => {
      setActiveId(docId);
      if (docId === activeDoc?.id) {
        const m = matches[matchIdx];
        if (m) {
          setCurrent(matchIdx);
          revealInEditor(activeDoc.content, m.index, m.index + m.length);
        }
      } else {
        pendingJump.current = { docId, matchIdx };
      }
    },
    [activeDoc, matches, setActiveId, revealInEditor]
  );

  // Resolve a pending cross-doc jump once the new tab's textarea mounts
  useEffect(() => {
    const pending = pendingJump.current;
    if (!pending || pending.docId !== activeDoc?.id) return;
    pendingJump.current = null;
    // Wait a frame so the freshly keyed textarea exists
    requestAnimationFrame(() => {
      const m = findMatches(activeDoc.content, query, caseSensitive)[pending.matchIdx];
      if (!m) return;
      setCurrent(pending.matchIdx);
      revealInEditor(activeDoc.content, m.index, m.index + m.length);
    });
  }, [activeDoc, query, caseSensitive, revealInEditor]);

  /** Replace the match under the cursor, then advance to the next one. */
  const replaceOne = useCallback(() => {
    if (!activeDoc || !matches.length) return;
    const m = matches[Math.min(current, matches.length - 1)];
    const nextContent =
      activeDoc.content.slice(0, m.index) +
      replaceText +
      activeDoc.content.slice(m.index + m.length);
    setContent(nextContent);
  }, [activeDoc, matches, current, replaceText, setContent]);

  /** Replace all matches in the active file; returns match count. */
  const replaceAllCurrent = useCallback(() => {
    if (!activeDoc) return 0;
    const { text, count } = replaceAllIn(
      activeDoc.content,
      query,
      caseSensitive,
      replaceText
    );
    if (count > 0) setContent(text);
    return count;
  }, [activeDoc, query, caseSensitive, replaceText, setContent]);

  /** Replace matches in every open doc; returns total match count. */
  const replaceAllFiles = useCallback(() => {
    let total = 0;
    for (const doc of docs) {
      const { text, count } = replaceAllIn(doc.content, query, caseSensitive, replaceText);
      if (count > 0) {
        updateDoc(doc.id, { content: text, dirty: true });
        total += count;
      }
    }
    return total;
  }, [docs, query, caseSensitive, replaceText, updateDoc]);

  return {
    open,
    mode,
    query,
    setQuery,
    replaceText,
    setReplaceText,
    caseSensitive,
    setCaseSensitive,
    matches,
    current,
    allResults,
    totalAllMatches,
    openSearch,
    close,
    next,
    prev,
    jumpToResult,
    replaceOne,
    replaceAllCurrent,
    replaceAllFiles,
  };
}
