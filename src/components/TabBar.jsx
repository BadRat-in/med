import { Box, Tabs, Text, ActionIcon } from "@mantine/core";

export default function TabBar({
  docs,
  activeId,
  onSelect,
  onClose,
  onNew,
  isDark,
  border,
}) {
  return (
    <Box
      style={{
        borderBottom: `1px solid ${border}`,
        background: isDark ? "#1e1e1e" : "#e8e8e8",
        flexShrink: 0,
        WebkitAppRegion: "drag",
      }}
    >
      <Tabs value={activeId} onChange={(id) => id && onSelect(id)} variant="outline">
        <Tabs.List
          style={{
            flexWrap: "nowrap",
            overflowX: "auto",
            borderBottom: "none",
            paddingLeft: 4,
            paddingTop: 4,
            WebkitAppRegion: "no-drag",
          }}
        >
          {docs.map((d) => (
            <Tabs.Tab
              key={d.id}
              value={d.id}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={(e) => onClose(d.id, e)}
                  aria-label="Close tab"
                >
                  ×
                </ActionIcon>
              }
              style={{
                maxWidth: 180,
                background:
                  d.id === activeId
                    ? isDark
                      ? "#2a2a2a"
                      : "#f7f7f7"
                    : "transparent",
              }}
            >
              <Text size="xs" lineClamp={1}>
                {d.dirty ? "• " : ""}
                {d.title?.length > 18 ? `${d.title.slice(0, 18)}...` : d.title}
              </Text>
            </Tabs.Tab>
          ))}
          <ActionIcon
            size="sm"
            variant="subtle"
            color="orange"
            onClick={onNew}
            m={4}
            mt={8}
            title="New file"
          >
            +
          </ActionIcon>
        </Tabs.List>
      </Tabs>
    </Box>
  );
}
