import { getCurrentWebviewWindow, WebviewWindow } from '@tauri-apps/api/webviewWindow'

const HANDOFF_KEY = 'med-window-handoff'

/**
 * Create a new app window. Optionally pass a single doc snapshot to open there.
 * Handoff uses localStorage (shared origin across windows).
 */
export async function openNewWindow(doc = null) {
  const label = `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  if (doc) {
    try {
      localStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({
          targetLabel: label,
          doc: {
            path: doc.path ?? null,
            title: doc.title || 'Untitled',
            content: doc.content ?? '',
            dirty: !!doc.dirty,
          },
          ts: Date.now(),
        })
      )
    } catch (e) {
      console.warn('handoff write failed', e)
    }
  }

  const win = new WebviewWindow(label, {
    title: doc?.title ? `MED — ${doc.title}` : 'MED',
    width: 1200,
    height: 760,
    minWidth: 800,
    minHeight: 500,
    center: true,
    focus: true,
  })

  return new Promise((resolve, reject) => {
    win.once('tauri://created', () => resolve(win))
    win.once('tauri://error', (e) => {
      try {
        localStorage.removeItem(HANDOFF_KEY)
      } catch (_) {}
      reject(e)
    })
  })
}

/** Read and clear handoff if it targets this window (or is recent and unlabeled). */
export function consumeHandoff() {
  try {
    const raw = localStorage.getItem(HANDOFF_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.doc) return null
    // Stale handoff (>15s) — ignore
    if (data.ts && Date.now() - data.ts > 15000) {
      localStorage.removeItem(HANDOFF_KEY)
      return null
    }
    const current = getCurrentWebviewWindow()
    if (data.targetLabel && current?.label && data.targetLabel !== current.label) {
      return null
    }
    localStorage.removeItem(HANDOFF_KEY)
    return data.doc
  } catch {
    return null
  }
}

export async function openExternalUrl(url) {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } catch {
    // Fallback: try shell via custom command if opener not available
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('open_url', { url })
    } catch (e) {
      console.warn('open url failed', e)
      window.open(url, '_blank')
    }
  }
}
