import { Box } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Horizontal split with a draggable divider.
 * `ratio` is the left pane fraction (0–1). Controlled via onRatioChange.
 */
export default function SplitPane({
  left,
  right,
  ratio = 0.5,
  onRatioChange,
  minRatio = 0.18,
  maxRatio = 0.82,
  border,
}) {
  const containerRef = useRef(null)
  const dragging = useRef(false)
  const [hover, setHover] = useState(false)

  const applyRatioFromClientX = useCallback(
    (clientX) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0) return
      let next = (clientX - rect.left) / rect.width
      next = Math.min(maxRatio, Math.max(minRatio, next))
      onRatioChange?.(next)
    },
    [maxRatio, minRatio, onRatioChange]
  )

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return
      e.preventDefault()
      applyRatioFromClientX(e.clientX)
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [applyRatioFromClientX])

  const onDividerDown = (e) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    applyRatioFromClientX(e.clientX)
  }

  const dividerColor = hover || dragging.current ? '#F6821F' : border

  return (
    <Box
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        minHeight: 0,
        minWidth: 0,
        position: 'relative',
      }}
    >
      <Box
        style={{
          width: `${ratio * 100}%`,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {left}
      </Box>

      <Box
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(minRatio * 100)}
        aria-valuemax={Math.round(maxRatio * 100)}
        onPointerDown={onDividerDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 5,
          flexShrink: 0,
          cursor: 'col-resize',
          background: dividerColor,
          transition: dragging.current ? 'none' : 'background 0.12s ease',
          zIndex: 2,
        }}
        title="Drag to resize"
      />

      <Box
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {right}
      </Box>
    </Box>
  )
}
