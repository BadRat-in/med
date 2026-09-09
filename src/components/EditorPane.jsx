import { Box, useMantineTheme } from "@mantine/core";

export default function EditorPane({
  content,
  onChange,
  isDark,
  border,
  editorRef,
  onScroll,
}) {
  const theme = useMantineTheme();
  const editorBg = isDark ? theme.other.editorDark : theme.other.editorLight;
  const text = isDark ? "#e8e8e8" : "#1a1a1a";

  return (
    <Box
      style={{
        flex: 1,
        borderRight: `1px solid ${border}`,
        background: editorBg,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      <textarea
        ref={editorRef}
        value={content ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onScroll={onScroll}
        spellCheck={false}
        style={{
          flex: 1,
          width: "100%",
          border: "none",
          outline: "none",
          resize: "none",
          padding: "16px 18px",
          fontFamily: theme.fontFamilyMonospace,
          fontSize: 13.5,
          lineHeight: 1.55,
          background: "transparent",
          color: text,
          tabSize: 2,
        }}
      />
    </Box>
  );
}
