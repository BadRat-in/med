import { ActionIcon, Box, Group, Menu, ScrollArea, Tabs, Text, UnstyledButton } from '@mantine/core'
import { homeDir } from '@tauri-apps/api/path'
import { useEffect, useRef, useState } from 'react'
import { basename, toTildePath } from '../lib/paths'

export default function TabBar({
  docs,
  activeId,
  onSelect,
  onClose,
  onNew,
  onOpenRecent,
  onClearRecent,
  onDetachTab,
  recent = [],
  isDark,
  border,
}) {
  const [home, setHome] = useState('')
  const dragIdRef = useRef(null)
  const [draggingId, setDraggingId] = useState(null)

  useEffect(() => {
    homeDir()
      .then(setHome)
      .catch(() => setHome(''))
  }, [])

  const onTabDragStart = (e, id) => {
    dragIdRef.current = id
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const onTabDragEnd = (e) => {
    const id = dragIdRef.current
    dragIdRef.current = null
    setDraggingId(null)
    if (!id) return

    // If dropped outside the window, detach into a new window
    const outside =
      e.clientX < 0 ||
      e.clientY < 0 ||
      e.clientX > window.innerWidth ||
      e.clientY > window.innerHeight
    if (outside) {
      onDetachTab?.(id)
    }
  }

  const headerBg = isDark ? '#1e1e1e' : '#e8e8e8'
  const menuBg = isDark ? '#2a2a2a' : '#ffffff'

  return (
    <Box
      style={{
        borderBottom: `1px solid ${border}`,
        background: headerBg,
        flexShrink: 0,
        WebkitAppRegion: 'drag',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <Box style={{ flex: 1, minWidth: 0, WebkitAppRegion: 'no-drag', maxHeight: 40 }}>
        <Tabs value={activeId} onChange={(id) => id && onSelect(id)} variant="outline">
          <Tabs.List
            style={{
              flexWrap: 'nowrap',
              overflowX: 'auto',
              borderBottom: 'none',
              paddingLeft: 4,
              paddingTop: 4,
            }}
          >
            {docs.map((d) => (
              <Tabs.Tab
                key={d.id}
                value={d.id}
                draggable
                onDragStart={(e) => onTabDragStart(e, d.id)}
                onDragEnd={onTabDragEnd}
                rightSection={
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={(e) => onClose(d.id, e)}
                    aria-label="Close tab"
                    style={{ flexShrink: 0 }}
                  >
                    ×
                  </ActionIcon>
                }
                style={{
                  maxWidth: 200,
                  maxHeight: 35,
                  minWidth: 0,
                  opacity: draggingId === d.id ? 0.5 : 1,
                  cursor: 'grab',
                  background: d.id === activeId ? (isDark ? '#2a2a2a' : '#f7f7f7') : 'transparent',
                }}
                title="Drag outside the window to open in a new window"
              >
                <Text size="xs" lineClamp={1}>
                  {d.dirty ? '• ' : ''}
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

      {/* Recent — top-right of tab bar */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: 16,
          paddingLeft: 4,
          WebkitAppRegion: 'no-drag',
          flexShrink: 0,
        }}
      >
        <Menu
          shadow="md"
          width={320}
          position="bottom-end"
          withinPortal
          styles={{ dropdown: { background: menuBg } }}
        >
          <Menu.Target>
            <UnstyledButton variant="subtle" title="Recent files" aria-label="Recent files">
              <Text size="xs" fw={600} c="gray" style={{ letterSpacing: '0.02em' }}>
                Recent
              </Text>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Recent files</Menu.Label>
            {recent.length === 0 ? (
              <Menu.Item disabled>No recent files</Menu.Item>
            ) : (
              <ScrollArea.Autosize mah={280} type="scroll" offsetScrollbars>
                {recent.map((item) => {
                  const path = item?.path ?? item
                  const fBasename = basename(path)
                  const fPath = toTildePath(path, home)
                  return (
                    <Menu.Item key={path} onClick={() => onOpenRecent?.(path)}>
                      <Group gap={6} wrap="nowrap" align="flex-start">
                        <Box style={{ minWidth: 0 }}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {fBasename?.length > 30 ? `${fBasename.slice(0, 30)}...` : fBasename}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {fPath?.length > 40
                              ? `${fPath.slice(0, 20)}...${fPath.slice(-20)}`
                              : fPath}
                          </Text>
                        </Box>
                      </Group>
                    </Menu.Item>
                  )
                })}
              </ScrollArea.Autosize>
            )}
            {recent.length > 0 && (
              <>
                <Menu.Divider />
                <Menu.Item color="red" onClick={() => onClearRecent?.()}>
                  Clear Recent
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Box>
  )
}
