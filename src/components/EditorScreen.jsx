import { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import { Box, Modal, Stack, Text, useMantineTheme } from "@mantine/core";
import TabBar from "./TabBar";
import EditorPane from "./EditorPane";
import PreviewPane from "./PreviewPane";
import SplitPane from "./SplitPane";
import SearchBar from "./SearchBar";
import { useMarkdownPreview } from "../hooks/useMarkdownPreview";
import { useScrollSync } from "../hooks/useScrollSync";
import { useSearch } from "../hooks/useSearch";
import { loadConfig, saveConfig } from "../lib/medStorage";

export default function EditorScreen({
  docs,
  activeId,
  activeDoc,
  setActiveId,
  setContent,
  handleCloseTab,
  handleNew,
  handleOpenRecent,
  handleClearRecent,
  handleDetachTab,
  recent,
  isDark,
  live,
  aboutOpen,
  setAboutOpen,
  searchHandlersRef,
}) {
  const theme = useMantineTheme();
  const bg = isDark ? theme.other.darkBg : theme.other.lightBg;
  const border = isDark ? theme.other.borderDark : theme.other.borderLight;

  const editorRef = useRef(null);
  const previewViewportRef = useRef(null);
  const replaceInputRef = useRef(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [replaceEnabled, setReplaceEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await loadConfig();
        if (!cancelled && typeof cfg.splitRatio === "number") {
          setSplitRatio(Math.min(0.82, Math.max(0.18, cfg.splitRatio)));
        }
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRatioChange = (next) => {
    setSplitRatio(next);
    loadConfig()
      .then((cfg) => saveConfig({ ...cfg, splitRatio: next }))
      .catch(() => {});
  };

  const { html, previewRef } = useMarkdownPreview({
    docId: activeDoc?.id,
    content: activeDoc?.content,
    live,
    isDark,
    enabled: true,
  });

  const { onEditorScroll } = useScrollSync({
    editorRef,
    previewBodyRef: previewRef,
    previewViewportRef,
    enabled: true,
  });

  const search = useSearch({
    docs,
    activeDoc,
    setActiveId,
    setContent,
    updateDoc: (id, updates) => {
      const doc = docs.find((d) => d.id === id);
      if (doc) {
        setContent(updates.content);
      }
    },
    editorRef,
  });

  // Register search handlers with the parent ref for keyboard shortcuts and native menu
  useLayoutEffect(() => {
    if (searchHandlersRef.current) {
      searchHandlersRef.current.openSearchCurrent = () => search.openSearch("current");
      searchHandlersRef.current.openSearchAll = () => search.openSearch("all");
      searchHandlersRef.current.closeSearch = () => search.close();
      searchHandlersRef.current.replaceOne = () => search.replaceOne();
      searchHandlersRef.current.replaceAllCurrent = () => search.replaceAllCurrent();
      searchHandlersRef.current.replaceAllFiles = () => search.replaceAllFiles();
      searchHandlersRef.current.findNext = () => search.next();
      searchHandlersRef.current.findPrev = () => search.prev();
      searchHandlersRef.current.focusReplaceInput = () => {
        if (replaceInputRef.current) {
          replaceInputRef.current.focus();
          replaceInputRef.current.select();
        }
      };
      searchHandlersRef.current.searchMode = search.mode;
    }
  }, [search, searchHandlersRef]);

  const handleSearchAll = useCallback((query) => {
    if (query.trim()) {
      search.setQuery(query);
      search.setMode("all");
      search.openSearch("all");
    }
  }, [search]);

  const handleSearchCurrent = useCallback(() => {
    search.setMode("current");
    search.openSearch("current");
  }, [search]);

  const handleCloseSearch = useCallback(() => {
    search.close();
    setReplaceEnabled(false);
  }, [search]);

  const handleToggleReplace = useCallback(() => {
    setReplaceEnabled((prev) => !prev);
  }, []);

  return (
    <Box
      style={{
        height: "100vh",
        background: bg,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <TabBar
        docs={docs}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={handleCloseTab}
        onNew={handleNew}
        onOpenRecent={handleOpenRecent}
        onClearRecent={handleClearRecent}
        onDetachTab={handleDetachTab}
        recent={recent}
        isDark={isDark}
        border={border}
      />

      <SearchBar
        visible={search.open}
        searchMode={search.mode}
        searchTerm={search.query}
        onSearchTermChange={search.setQuery}
        replaceText={search.replaceText}
        onReplaceTextChange={search.setReplaceText}
        caseSensitive={search.caseSensitive}
        onCaseSensitiveToggle={() => search.setCaseSensitive(!search.caseSensitive)}
        replaceEnabled={replaceEnabled}
        onToggleReplace={handleToggleReplace}
        onClose={handleCloseSearch}
        onNext={search.next}
        onPrevious={search.prev}
        onSearchAll={handleSearchAll}
        onSearchCurrent={handleSearchCurrent}
        onReplaceOne={search.replaceOne}
        onReplaceAll={
          search.mode === "current"
            ? search.replaceAllCurrent
            : search.replaceAllFiles
        }
        currentFileResultsCount={search.matches.length}
        currentFileCurrentIndex={search.current}
        totalAllMatches={search.totalAllMatches}
        allResults={search.allResults}
        onJumpToResult={search.jumpToResult}
        isDark={isDark}
        replaceInputRef={replaceInputRef}
      />

      <SplitPane
        ratio={splitRatio}
        onRatioChange={onRatioChange}
        border={border}
        isDark={isDark}
        left={
          <EditorPane
            key={activeDoc?.id}
            content={activeDoc?.content}
            onChange={setContent}
            isDark={isDark}
            editorRef={editorRef}
            onScroll={onEditorScroll}
          />
        }
        right={
          <PreviewPane
            html={html}
            previewRef={previewRef}
            viewportRef={previewViewportRef}
            isDark={isDark}
            border={border}
            bg={bg}
          />
        }
      />

      <Modal opened={aboutOpen} onClose={() => setAboutOpen(false)} title="About MED" centered>
        <Stack gap="xs">
          <Text fw={600}>MED — Markdown Editor</Text>
          <Text size="sm" c="dimmed">
            Live Markdown + Mermaid. Tabs for multiple files. Config in{" "}
            <code>~/.med/</code>.
          </Text>
          <Text size="xs" c="dimmed">
            ⌘N New · ⌘O Open · ⌘S Save · ⇧⌘S Save As · ⌘W Close · ⇧⌘L Theme · ⇧⌘P Live
          </Text>
          <Text size="xs" c="dimmed">
            ⌘F Find · ⇧⌘F Find in Files · ⌘R Replace · ⇧⌘R Replace All
          </Text>
        </Stack>
      </Modal>
    </Box>
  );
}