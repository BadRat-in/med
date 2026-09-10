import { useState, useEffect, useRef, useCallback } from "react";
import { useMantineTheme } from "@mantine/core";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import HomeScreen from "./components/HomeScreen";
import EditorScreen from "./components/EditorScreen";
import { useConfig } from "./hooks/useConfig";
import { useRecentFiles } from "./hooks/useRecentFiles";
import { useDocuments } from "./hooks/useDocuments";
import { useNativeMenu } from "./hooks/useNativeMenu";
import { openNewWindow, consumeHandoff } from "./lib/windows";

export default function App() {
  const theme = useMantineTheme();
  const [screen, setScreen] = useState("home");
  const [aboutOpen, setAboutOpen] = useState(false);

  const {
    isDark,
    live,
    toggleTheme,
    toggleLive,
  } = useConfig();

  const { recent, pushRecent, clearRecent } = useRecentFiles();

  const enterEditor = useCallback(() => setScreen("editor"), []);
  const goHome = useCallback(() => setScreen("home"), []);

  const {
    docs,
    activeId,
    setActiveId,
    activeDoc,
    setContent,
    openPaths,
    handleOpen,
    handleOpenRecent,
    handleNew,
    handleSave,
    handleSaveAs,
    handleCloseTab,
    adoptDoc,
  } = useDocuments({
    pushRecent,
    onEnterEditor: enterEditor,
    onEmpty: goHome,
  });

  // Consume handoff from another window (tab detach / new window with doc)
  useEffect(() => {
    const handoff = consumeHandoff();
    if (handoff) {
      adoptDoc?.(handoff);
    }
  }, [adoptDoc]);

  // OS "Open With" / file associations
  useEffect(() => {
    let unlisten = () => {};
    (async () => {
      try {
        const cold = await invoke("get_opened_files");
        if (Array.isArray(cold) && cold.length) await openPaths(cold);
      } catch (_) {}
      try {
        unlisten = await listen("med://open-files", (event) => {
          const payload = event.payload;
          if (Array.isArray(payload) && payload.length) openPaths(payload);
        });
      } catch (_) {}
    })();
    return () => {
      try {
        unlisten();
      } catch (_) {}
    };
  }, [openPaths]);

  const handleNewWindow = useCallback(async () => {
    try {
      await openNewWindow(null);
    } catch (e) {
      console.warn("new window failed", e);
    }
  }, []);

  const handleDetachTab = useCallback(
    async (id) => {
      const doc = docs.find((d) => d.id === id);
      if (!doc) return;
      try {
        await openNewWindow({
          path: doc.path,
          title: doc.title,
          content: doc.content,
          dirty: doc.dirty,
        });
        // Close without dirty prompt — content moved to the other window
        await handleCloseTab(id, { force: true });
      } catch (e) {
        console.warn("detach tab failed", e);
      }
    },
    [docs, handleCloseTab]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "o") {
        e.preventDefault();
        handleOpen();
      } else if (k === "s") {
        e.preventDefault();
        if (e.shiftKey) handleSaveAs();
        else handleSave();
      } else if (k === "n") {
        e.preventDefault();
        if (e.shiftKey) handleNewWindow();
        else handleNew();
      } else if (k === "w") {
        e.preventDefault();
        if (activeId) handleCloseTab(activeId);
      } else if (k === "l" && e.shiftKey) {
        e.preventDefault();
        toggleTheme();
      } else if (k === "p" && e.shiftKey) {
        e.preventDefault();
        toggleLive();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    activeId,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleNew,
    handleNewWindow,
    handleCloseTab,
    toggleTheme,
    toggleLive,
  ]);

  // Native menu — handlers via ref so menu stays fresh
  const handlersRef = useRef({});
  handlersRef.current = {
    handleNew,
    handleOpen,
    handleSave,
    handleSaveAs,
    handleCloseTab,
    handleOpenRecent,
    clearRecent,
    handleGoHome: goHome,
    setAboutOpen,
    toggleTheme,
    toggleLive,
    isDark,
    live,
    activeId,
    recent,
    handleNewWindow,
    handleDetachTab,
  };
  useNativeMenu(handlersRef, recent);

  if (screen === "home") {
    return (
      <HomeScreen
        isDark={isDark}
        theme={theme}
        recent={recent}
        onOpen={handleOpen}
        onNew={handleNew}
        onOpenRecent={handleOpenRecent}
        onClearRecent={clearRecent}
        aboutOpen={aboutOpen}
        setAboutOpen={setAboutOpen}
      />
    );
  }

  return (
    <EditorScreen
      docs={docs}
      activeId={activeId}
      activeDoc={activeDoc}
      setActiveId={setActiveId}
      setContent={setContent}
      handleCloseTab={handleCloseTab}
      handleNew={handleNew}
      handleOpenRecent={handleOpenRecent}
      handleClearRecent={clearRecent}
      handleDetachTab={handleDetachTab}
      recent={recent}
      isDark={isDark}
      live={live}
      aboutOpen={aboutOpen}
      setAboutOpen={setAboutOpen}
    />
  );
}
