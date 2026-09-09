import { Box, Stack, Text, Button, Group, UnstyledButton, Modal } from "@mantine/core";
import { basename, dirname } from "../lib/paths";

export default function HomeScreen({
  isDark,
  theme,
  recent,
  onOpen,
  onNew,
  onOpenRecent,
  onClearRecent,
  aboutOpen,
  setAboutOpen,
}) {
  const bg = isDark ? theme.other.darkBg : theme.other.lightBg;
  const border = isDark ? theme.other.borderDark : theme.other.borderLight;
  const cardBg = isDark ? theme.other.editorDark : theme.other.editorLight;
  const hoverBg = isDark ? "#333333" : "#e8e8e8";
  const headerBg = isDark ? "#1e1e1e" : "#e8e8e8";
  const text = isDark ? "#e8e8e8" : "#1a1a1a";

  return (
    <Box
      style={{
        height: "100vh",
        background: bg,
        display: "flex",
        flexDirection: "column",
        color: text,
      }}
    >
      <Box
        style={{
          height: 28,
          flexShrink: 0,
          WebkitAppRegion: "drag",
          background: headerBg,
          borderBottom: `1px solid ${border}`,
        }}
      />

      <Box
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          overflow: "auto",
        }}
      >
        <Stack gap="xl" maw={520} w="100%" align="stretch">
          <Stack gap={4} align="center">
            <Text
              style={{
                fontSize: 42,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#F6821F",
              }}
            >
              MED
            </Text>
            <Text size="sm" c="dimmed">
              Markdown Editor
            </Text>
          </Stack>

          <Group justify="center" gap="sm">
            <Button size="md" color="orange" onClick={onOpen} style={{ minWidth: 140 }}>
              Open File…
            </Button>
            <Button
              size="md"
              variant="light"
              color="orange"
              onClick={onNew}
              style={{ minWidth: 140 }}
            >
              New File
            </Button>
          </Group>

          <Text size="xs" c="dimmed" ta="center">
            ⌘O Open · ⌘N New · ⌘⇧L Theme
          </Text>

          {recent.length > 0 ? (
            <Stack gap="xs" mt="md">
              <Group justify="space-between" px={4}>
                <Text size="xs" tt="uppercase" c="dimmed" fw={600}>
                  Recent
                </Text>
                <UnstyledButton onClick={onClearRecent}>
                  <Text size="xs" c="dimmed" style={{ textDecoration: "underline" }}>
                    Clear
                  </Text>
                </UnstyledButton>
              </Group>
              <Box
                style={{
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: cardBg,
                  overflow: "hidden",
                }}
              >
                {recent.map((p, i) => (
                  <UnstyledButton
                    key={p}
                    onClick={() => onOpenRecent(p)}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 14px",
                      borderBottom:
                        i < recent.length - 1 ? `1px solid ${border}` : "none",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Text size="sm" fw={500} lineClamp={1}>
                      {basename(p)}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {dirname(p) || p}
                    </Text>
                  </UnstyledButton>
                ))}
              </Box>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center" mt="md">
              No recent files yet. Open a Markdown file to get started.
            </Text>
          )}
        </Stack>
      </Box>

      <Modal opened={aboutOpen} onClose={() => setAboutOpen(false)} title="About MED" centered>
        <Stack gap="xs">
          <Text fw={600}>MED — Markdown Editor</Text>
          <Text size="sm" c="dimmed">
            Live Markdown + Mermaid preview. Multiple files as tabs. Settings in{" "}
            <code>~/.med/</code>.
          </Text>
        </Stack>
      </Modal>
    </Box>
  );
}
