import { useRef, useState, useEffect } from "react";
import { Box, Modal, Stack, Text, useMantineTheme } from "@mantine/core";
import TabBar from "./TabBar";
import EditorPane from "./EditorPane";
import PreviewPane from "./PreviewPane";
import SplitPane from "./SplitPane";
import { useMarkdownPreview } from "../hooks/useMarkdownPreview";
import { useScrollSync } from "../hooks/useScrollSync";
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
}) {
  const theme = useMantineTheme();
  const bg = isDark ? theme.other.darkBg : theme.other.lightBg;
  const border = isDark ? theme.other.borderDark : theme.other.borderLight;

  const editorRef = useRef(null);
  const previewViewportRef = useRef(null);
  const [splitRatio, setSplitRatio] = useState(0.5);

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
    // Persist without blocking UI
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

  return (
    <Box
      style={{
        height: "100vh",
        background: bg,
        display: "flex",
        flexDirection: "column",
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
        </Stack>
      </Modal>
    </Box>
  );
}
