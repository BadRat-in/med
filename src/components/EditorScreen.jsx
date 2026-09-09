import { useRef } from "react";
import { Box, Modal, Stack, Text, useMantineTheme } from "@mantine/core";
import TabBar from "./TabBar";
import EditorPane from "./EditorPane";
import PreviewPane from "./PreviewPane";
import { useMarkdownPreview } from "../hooks/useMarkdownPreview";
import { useScrollSync } from "../hooks/useScrollSync";

export default function EditorScreen({
  docs,
  activeId,
  activeDoc,
  setActiveId,
  setContent,
  handleCloseTab,
  handleNew,
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
        isDark={isDark}
        border={border}
      />

      <Box style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <EditorPane
          key={activeDoc?.id}
          content={activeDoc?.content}
          onChange={setContent}
          isDark={isDark}
          border={border}
          editorRef={editorRef}
          onScroll={onEditorScroll}
        />
        <PreviewPane
          html={html}
          previewRef={previewRef}
          viewportRef={previewViewportRef}
          isDark={isDark}
          border={border}
          bg={bg}
        />
      </Box>

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
