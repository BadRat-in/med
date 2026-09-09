# MED — Markdown Editor

A fast desktop Markdown editor with live preview and Mermaid diagrams.  
Built with **Tauri 2**, **React**, and **Mantine**.

## Features

- **Split view** — editor (left) + live preview (right) in one window
- **Tabs** — multiple open files (Notepad-style)
- **Home screen** — Open / New plus a scrollable recent list (paths shown as `~/…`)
- **Session restore** — files left open are restored on relaunch
- **Native menu bar** — File / Edit / View (no in-window toolbar)
- **Open Recent** — in the File menu and on the home screen
- **Mermaid** — diagrams render in the preview; theme follows light/dark
- **Content-based scroll sync** — editor and preview stay aligned by source line, not pane height
- **Preview cache** — tab switches reuse rendered HTML (including Mermaid SVGs)
- **Markdown file handler** — register as default app for `.md`, `.markdown`, `.mdx`
- Light / dark mode (neutral grey + soft off-white)

### Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘N` | New |
| `⌘O` | Open |
| `⌘S` | Save |
| `⇧⌘S` | Save As |
| `⌘W` | Close tab |
| `⇧⌘L` | Toggle light / dark |
| `⇧⌘P` | Toggle live preview |

## Theme

| Token | Light | Dark |
|-------|--------|------|
| App background | `#f0f0f0` | `#1e1e1e` |
| Editor | `#f7f7f7` | `#2a2a2a` |
| Code blocks | `#e8e8e8` | `#333333` |
| Primary | `#F6821F` (orange) | same |

## Data stored in `~/.med/`

```
~/.med/config.json    # theme, live-preview preference
~/.med/recent.json    # [{ "path": "…", "lastOpened": … }, …]
~/.med/session.json   # { "paths": […], "activePath": "…" }
```

Legacy `recent.json` entries that are plain strings are migrated automatically.

## Prerequisites

- **Node.js** 18+
- **Rust** (stable) — [rustup](https://rustup.rs)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)

## Development

```bash
# install (npm or pnpm)
pnpm install   # or: npm install

# run
pnpm tauri dev # or: npm run tauri dev
```

## Build

```bash
pnpm tauri build   # or: npm run tauri build
```

Outputs (macOS):

```
src-tauri/target/release/bundle/macos/
src-tauri/target/release/bundle/dmg/
```

### Set as default Markdown app (macOS)

After installing the `.app`: right-click any `.md` file → **Get Info** → **Open with** → **MED** → **Change All…**.

## Project layout

```
src/
├── App.jsx                 # home ↔ editor wiring
├── main.jsx
├── theme.js
├── components/
│   ├── HomeScreen.jsx      # open / new / recent
│   ├── EditorScreen.jsx
│   ├── TabBar.jsx
│   ├── EditorPane.jsx
│   └── PreviewPane.jsx
├── hooks/
│   ├── useConfig.js
│   ├── useRecentFiles.js
│   ├── useDocuments.js     # tabs + session restore
│   ├── useMarkdownPreview.js
│   ├── useNativeMenu.js
│   └── useScrollSync.js    # content-based scroll sync
└── lib/
    ├── markdown.js         # marked + mermaid
    ├── medStorage.js       # ~/.med/ read/write
    └── paths.js            # basename, ~/ display paths

src-tauri/
├── tauri.conf.json         # productName MED, fileAssociations
├── Info.plist              # macOS document types
├── capabilities/
├── icons/
└── src/                    # open-with / session file events
```

## License

Private / unlicensed unless otherwise stated.
