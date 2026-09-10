import {
  ActionIcon,
  Box,
  Group,
  ScrollArea,
  Text,
  TextInput,
  Tooltip,
  UnstyledButton,
} from '@mantine/core'
import {
  IconArrowRight,
  IconChevronDown,
  IconChevronUp,
  IconFileText,
  IconLetterCase,
  IconRegex,
  IconReplace,
  IconSearch,
  IconX,
} from '@tabler/icons-react'
import { useEffect, useRef, useState } from 'react'

/**
 * Zed-style buffer search bar.
 *
 * Compact toolbar that sits under the tab bar:
 *  - Find row (always)
 *  - Replace row (when replaceEnabled)
 *  - Optional results list for "all open files" mode
 */
export default function SearchBar({
  visible,
  searchMode, // "current" | "all"
  searchTerm,
  onSearchTermChange,
  replaceText,
  onReplaceTextChange,
  caseSensitive,
  onCaseSensitiveToggle,
  replaceEnabled,
  onToggleReplace,
  onClose,
  onNext,
  onPrevious,
  onSearchAll,
  onSearchCurrent,
  onReplaceOne,
  onReplaceAll,
  currentFileResultsCount,
  currentFileCurrentIndex,
  totalAllMatches,
  allResults,
  onJumpToResult,
  isDark,
  replaceInputRef,
}) {
  const searchInputRef = useRef(null)
  const [hoveredResult, setHoveredResult] = useState(null)

  useEffect(() => {
    if (visible && searchInputRef.current) {
      searchInputRef.current.focus()
      searchInputRef.current.select()
    }
  }, [visible])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchMode === 'current') {
        if (e.shiftKey) onPrevious()
        else onNext()
      }
      return
    }

    // ⌘R / Ctrl+R → replace one; ⇧⌘R → replace all
    if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (e.shiftKey) onReplaceAll()
      else onReplaceOne()
      return
    }

    // ⌥⌘C → toggle case
    if (e.key === 'c' && (e.metaKey || e.ctrlKey) && e.altKey) {
      e.preventDefault()
      onCaseSensitiveToggle()
    }
  }

  // Zed-ish colors
  const bg = isDark ? '#1c1c1c' : '#f5f5f5'
  const border = isDark ? '#2e2e2e' : '#e0e0e0'
  const inputBg = isDark ? '#2a2a2a' : '#ffffff'
  const text = isDark ? '#e4e4e4' : '#1a1a1a'
  const muted = isDark ? '#8a8a8a' : '#6b6b6b'
  const accent = '#f6821f'
  const hoverBg = isDark ? '#2a2a2a' : '#ebebeb'

  if (!visible) return null

  const matchLabel =
    searchMode === 'current'
      ? currentFileResultsCount > 0
        ? `${currentFileCurrentIndex + 1} of ${currentFileResultsCount}`
        : searchTerm
          ? 'No results'
          : ''
      : totalAllMatches > 0
        ? `${totalAllMatches} match${totalAllMatches === 1 ? '' : 'es'} in ${
            new Set(allResults.map((r) => r.doc.id)).size
          } file${new Set(allResults.map((r) => r.doc.id)).size === 1 ? '' : 's'}`
        : searchTerm
          ? 'No results'
          : ''

  // Group all-results by doc for a cleaner list
  const grouped =
    searchMode === 'all'
      ? allResults.reduce((acc, r) => {
          const id = r.doc.id
          if (!acc[id]) acc[id] = { doc: r.doc, items: [] }
          acc[id].items.push(r)
          return acc
        }, {})
      : {}

  return (
    <Box
      style={{
        flexShrink: 0,
        background: bg,
        borderBottom: `1px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* ── Find row ─────────────────────────────────────────────── */}
      <Group gap={6} wrap="nowrap" px={10} py={6} style={{ alignItems: 'center', minHeight: 40 }}>
        {/* Mode indicator */}
        <Tooltip
          label={
            searchMode === 'current' ? 'Find in current file (⌘F)' : 'Find in open files (⇧⌘F)'
          }
          withArrow
          openDelay={400}
        >
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 4,
              color: accent,
              flexShrink: 0,
            }}
          >
            <IconSearch size={15} stroke={1.75} />
          </Box>
        </Tooltip>

        <TextInput
          ref={searchInputRef}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={searchMode === 'current' ? 'Find in file…' : 'Find in open files…'}
          size="xs"
          variant="unstyled"
          style={{ flex: 1, minWidth: 120 }}
          styles={{
            input: {
              background: inputBg,
              color: text,
              border: `1px solid ${border}`,
              borderRadius: 5,
              padding: '4px 10px',
              fontSize: 13,
              height: 28,
              lineHeight: '20px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
          }}
        />

        {/* Options */}
        <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Tooltip label="Match Case (⌥⌘C)" withArrow openDelay={400}>
            <ActionIcon
              size={26}
              variant={caseSensitive ? 'light' : 'subtle'}
              color={caseSensitive ? 'orange' : 'gray'}
              onClick={onCaseSensitiveToggle}
              style={{
                color: caseSensitive ? accent : muted,
                background: caseSensitive
                  ? isDark
                    ? 'rgba(246,130,31,0.15)'
                    : 'rgba(246,130,31,0.12)'
                  : 'transparent',
              }}
            >
              <IconLetterCase size={14} stroke={1.75} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Regex — not yet" withArrow openDelay={400}>
            <ActionIcon
              size={26}
              variant="subtle"
              color="gray"
              disabled
              style={{ color: muted, opacity: 0.45 }}
            >
              <IconRegex size={14} stroke={1.75} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Whole Word — not yet" withArrow openDelay={400}>
            <ActionIcon
              size={26}
              variant="subtle"
              color="gray"
              disabled
              style={{ color: muted, opacity: 0.45 }}
            >
              <Text size="xs" fw={700} style={{ fontSize: 11, letterSpacing: '-0.02em' }}>
                W
              </Text>
            </ActionIcon>
          </Tooltip>
        </Group>

        {/* Match count */}
        <Text
          size="xs"
          style={{
            color: muted,
            minWidth: searchMode === 'current' ? 72 : 110,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          {matchLabel}
        </Text>

        {/* Navigation (current file only) */}
        {searchMode === 'current' && (
          <Group gap={1} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Previous (⇧↵)" withArrow openDelay={400}>
              <ActionIcon
                size={26}
                variant="subtle"
                color="gray"
                onClick={onPrevious}
                disabled={currentFileResultsCount === 0}
                style={{ color: muted }}
              >
                <IconChevronUp size={15} stroke={1.75} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Next (↵)" withArrow openDelay={400}>
              <ActionIcon
                size={26}
                variant="subtle"
                color="gray"
                onClick={onNext}
                disabled={currentFileResultsCount === 0}
                style={{ color: muted }}
              >
                <IconChevronDown size={15} stroke={1.75} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}

        {/* Replace toggle */}
        <Tooltip label={replaceEnabled ? 'Hide Replace' : 'Show Replace'} withArrow openDelay={400}>
          <ActionIcon
            size={26}
            variant={replaceEnabled ? 'light' : 'subtle'}
            color={replaceEnabled ? 'orange' : 'gray'}
            onClick={onToggleReplace}
            style={{
              color: replaceEnabled ? accent : muted,
              background: replaceEnabled
                ? isDark
                  ? 'rgba(246,130,31,0.15)'
                  : 'rgba(246,130,31,0.12)'
                : 'transparent',
              flexShrink: 0,
            }}
          >
            <IconReplace size={14} stroke={1.75} />
          </ActionIcon>
        </Tooltip>

        {/* Switch mode */}
        {searchMode === 'current' ? (
          <Tooltip label="Find in Open Files (⇧⌘F)" withArrow openDelay={400}>
            <ActionIcon
              size={26}
              variant="subtle"
              color="gray"
              onClick={() => onSearchAll(searchTerm)}
              disabled={!searchTerm.trim()}
              style={{ color: muted, flexShrink: 0 }}
            >
              <IconFileText size={14} stroke={1.75} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Tooltip label="Find in Current File (⌘F)" withArrow openDelay={400}>
            <ActionIcon
              size={26}
              variant="subtle"
              color="gray"
              onClick={onSearchCurrent}
              style={{ color: muted, flexShrink: 0 }}
            >
              <IconArrowRight size={14} stroke={1.75} />
            </ActionIcon>
          </Tooltip>
        )}

        {/* Close */}
        <Tooltip label="Close (Esc)" withArrow openDelay={400}>
          <ActionIcon
            size={26}
            variant="subtle"
            color="gray"
            onClick={onClose}
            style={{ color: muted, flexShrink: 0 }}
          >
            <IconX size={14} stroke={1.75} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {/* ── Replace row ──────────────────────────────────────────── */}
      {replaceEnabled && (
        <Group gap={6} wrap="nowrap" px={10} pb={6} style={{ alignItems: 'center', minHeight: 34 }}>
          {/* Spacer to align under search icon */}
          <Box style={{ width: 28, flexShrink: 0 }} />

          <TextInput
            ref={replaceInputRef}
            value={replaceText}
            onChange={(e) => onReplaceTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace…"
            size="xs"
            variant="unstyled"
            style={{ flex: 1, minWidth: 120 }}
            styles={{
              input: {
                background: inputBg,
                color: text,
                border: `1px solid ${border}`,
                borderRadius: 5,
                padding: '4px 10px',
                fontSize: 13,
                height: 28,
                lineHeight: '20px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              },
            }}
          />

          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Tooltip label="Replace (⌘R)" withArrow openDelay={400}>
              <UnstyledButton
                onClick={onReplaceOne}
                disabled={
                  searchMode === 'current' ? currentFileResultsCount === 0 : totalAllMatches === 0
                }
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: muted,
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  cursor:
                    (searchMode === 'current' ? currentFileResultsCount : totalAllMatches) === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    (searchMode === 'current' ? currentFileResultsCount : totalAllMatches) === 0
                      ? 0.45
                      : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                Replace
              </UnstyledButton>
            </Tooltip>
            <Tooltip
              label={
                searchMode === 'current'
                  ? 'Replace All in File (⇧⌘R)'
                  : 'Replace All in Open Files (⇧⌘R)'
              }
              withArrow
              openDelay={400}
            >
              <UnstyledButton
                onClick={onReplaceAll}
                disabled={
                  searchMode === 'current' ? currentFileResultsCount === 0 : totalAllMatches === 0
                }
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isDark ? '#fff' : '#1a1a1a',
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: `1px solid ${border}`,
                  background: isDark ? '#333' : '#e8e8e8',
                  cursor:
                    (searchMode === 'current' ? currentFileResultsCount : totalAllMatches) === 0
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    (searchMode === 'current' ? currentFileResultsCount : totalAllMatches) === 0
                      ? 0.45
                      : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                Replace All
              </UnstyledButton>
            </Tooltip>
          </Group>
        </Group>
      )}

      {/* ── All-files results list ───────────────────────────────── */}
      {searchMode === 'all' && searchTerm.trim() && (
        <Box
          style={{
            borderTop: `1px solid ${border}`,
            maxHeight: 280,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ScrollArea style={{ flex: 1 }} offsetScrollbars type="auto">
            {Object.keys(grouped).length === 0 ? (
              <Box py={20} style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">
                  No matches in open files
                </Text>
              </Box>
            ) : (
              <Box py={4}>
                {Object.values(grouped).map(({ doc, items }) => (
                  <Box key={doc.id} mb={2}>
                    {/* File header */}
                    <Group
                      gap={6}
                      px={12}
                      py={4}
                      wrap="nowrap"
                      style={{
                        position: 'sticky',
                        top: 0,
                        background: bg,
                        zIndex: 1,
                      }}
                    >
                      <IconFileText size={13} color={accent} style={{ flexShrink: 0 }} />
                      <Text
                        size="xs"
                        fw={600}
                        style={{ color: text, flex: 1, minWidth: 0 }}
                        lineClamp={1}
                      >
                        {doc.title || 'Untitled'}
                      </Text>
                      <Text size="xs" style={{ color: muted, flexShrink: 0 }}>
                        {items.length}
                      </Text>
                    </Group>

                    {items.map((result) => {
                      const key = `${result.doc.id}-${result.matchIndex}`
                      const isHovered = hoveredResult === key
                      return (
                        <UnstyledButton
                          key={key}
                          onClick={() => onJumpToResult(result.doc.id, result.matchIndex)}
                          onMouseEnter={() => setHoveredResult(key)}
                          onMouseLeave={() => setHoveredResult(null)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '5px 12px 5px 32px',
                            background: isHovered ? hoverBg : 'transparent',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <Group gap={8} wrap="nowrap" style={{ alignItems: 'baseline' }}>
                            <Text
                              size="xs"
                              style={{
                                color: muted,
                                fontVariantNumeric: 'tabular-nums',
                                minWidth: 36,
                                flexShrink: 0,
                              }}
                            >
                              L{result.line + 1}
                            </Text>
                            <Text
                              size="xs"
                              style={{
                                color: text,
                                fontFamily:
                                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {result.snippet}
                            </Text>
                          </Group>
                        </UnstyledButton>
                      )
                    })}
                  </Box>
                ))}
              </Box>
            )}
          </ScrollArea>
        </Box>
      )}
    </Box>
  )
}
