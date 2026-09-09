import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { open, save, ask } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { basename } from "../lib/paths";
import { WELCOME_MD } from "../lib/markdown";
import { loadSession, saveSession } from "../lib/medStorage";
import { invalidatePreviewCache } from "./useMarkdownPreview";

function newDoc(overrides = {}) {
  return {
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    path: null,
    title: "Untitled",
    content: "",
    dirty: false,
    ...overrides,
  };
}

export function useDocuments({ pushRecent, onEnterEditor, onEmpty }) {
  const [docs, setDocs] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState("Ready");
  const [sessionReady, setSessionReady] = useState(false);
  const skipNextSave = useRef(true);

  const activeDoc = useMemo(
    () => docs.find((d) => d.id === activeId) || null,
    [docs, activeId]
  );

  const updateActive = useCallback(
    (patch) => {
      setDocs((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, ...patch } : d))
      );
    },
    [activeId]
  );

  const setContent = useCallback(
    (value) => updateActive({ content: value, dirty: true }),
    [updateActive]
  );

  const openPaths = useCallback(
    async (paths, options = {}) => {
      const { activePath = null, activate = true } = options;
      const list = (Array.isArray(paths) ? paths : [paths]).filter(Boolean);
      if (!list.length) return;

      const opened = [];
      for (const selected of list) {
        try {
          const text = await readTextFile(selected);
          opened.push(
            newDoc({
              path: selected,
              title: basename(selected),
              content: text,
              dirty: false,
            })
          );
          await pushRecent?.(selected);
        } catch (e) {
          console.error(e);
          setStatus(`Failed to open ${basename(selected)}`);
        }
      }
      if (!opened.length) return;

      let focusId = null;
      setDocs((prev) => {
        const next = [...prev];
        let lastId = null;
        for (const doc of opened) {
          const existing = next.find((d) => d.path && d.path === doc.path);
          if (existing) {
            lastId = existing.id;
            if (activePath && existing.path === activePath) focusId = existing.id;
            continue;
          }
          next.push(doc);
          lastId = doc.id;
          if (activePath && doc.path === activePath) focusId = doc.id;
        }
        if (activate) {
          setActiveId(focusId || lastId);
        }
        return next;
      });
      if (activate) onEnterEditor?.();
      setStatus("Opened");
    },
    [pushRecent, onEnterEditor]
  );

  // Restore previous session once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await loadSession();
        if (cancelled) return;
        if (session.paths?.length) {
          await openPaths(session.paths, {
            activePath: session.activePath,
            activate: true,
          });
        }
      } catch (e) {
        console.warn("session restore failed", e);
      } finally {
        if (!cancelled) {
          skipNextSave.current = false;
          setSessionReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist open file paths whenever tabs change
  useEffect(() => {
    if (!sessionReady || skipNextSave.current) return;
    const paths = docs.map((d) => d.path).filter(Boolean);
    const activePath = docs.find((d) => d.id === activeId)?.path || null;
    saveSession({ paths, activePath });
  }, [docs, activeId, sessionReady]);

  const handleOpen = useCallback(async () => {
    const selected = await open({
      multiple: true,
      filters: [
        { name: "Markdown", extensions: ["md", "markdown", "mdx"] },
        { name: "All", extensions: ["*"] },
      ],
    });
    if (!selected) return;
    await openPaths(Array.isArray(selected) ? selected : [selected]);
  }, [openPaths]);

  const handleOpenRecent = useCallback(
    async (path) => openPaths([path]),
    [openPaths]
  );

  const handleNew = useCallback(() => {
    const doc = newDoc({ content: WELCOME_MD, title: "Untitled" });
    setDocs((prev) => [...prev, doc]);
    setActiveId(doc.id);
    onEnterEditor?.();
    setStatus("New file");
  }, [onEnterEditor]);

  const handleSaveAs = useCallback(async () => {
    if (!activeDoc) return;
    const target = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
      defaultPath: activeDoc.path || activeDoc.title || "untitled.md",
    });
    if (!target) return;
    await writeTextFile(target, activeDoc.content);
    updateActive({ path: target, title: basename(target), dirty: false });
    await pushRecent?.(target);
    setStatus("Saved");
    setTimeout(() => setStatus((s) => (s === "Saved" ? "Live" : s)), 1500);
  }, [activeDoc, updateActive, pushRecent]);

  const handleSave = useCallback(async () => {
    if (!activeDoc) {
      await handleOpen();
      return;
    }
    if (!activeDoc.path) {
      await handleSaveAs();
      return;
    }
    await writeTextFile(activeDoc.path, activeDoc.content);
    updateActive({ dirty: false });
    await pushRecent?.(activeDoc.path);
    setStatus("Saved");
    setTimeout(() => setStatus((s) => (s === "Saved" ? "Live" : s)), 1500);
  }, [activeDoc, handleOpen, handleSaveAs, updateActive, pushRecent]);

  const handleCloseTab = useCallback(
    async (id, e) => {
      e?.stopPropagation?.();
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;
      if (doc.dirty) {
        const yes = await ask(
          `"${doc.title}" has unsaved changes. Close without saving?`,
          { title: "MED", kind: "warning" }
        );
        if (!yes) return;
      }
      invalidatePreviewCache(id);
      setDocs((prev) => {
        const next = prev.filter((d) => d.id !== id);
        if (next.length === 0) {
          setActiveId(null);
          onEmpty?.();
          return [];
        }
        if (activeId === id) {
          const idx = prev.findIndex((d) => d.id === id);
          const fallback = next[Math.max(0, idx - 1)] || next[0];
          setActiveId(fallback.id);
        }
        return next;
      });
    },
    [docs, activeId, onEmpty]
  );

  return {
    docs,
    activeId,
    setActiveId,
    activeDoc,
    status,
    setStatus,
    setContent,
    openPaths,
    handleOpen,
    handleOpenRecent,
    handleNew,
    handleSave,
    handleSaveAs,
    handleCloseTab,
    sessionReady,
  };
}
