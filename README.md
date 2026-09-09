# MED — Markdown Editor

A fast desktop Markdown editor with live preview and Mermaid diagrams.
Built with Tauri 2 + React + Mantine.

## Features

- Split view: editor (left) + live preview (right) in **one window**
- **Tabs** for multiple open files (Notepad-style)
- **File menu**: New, Open, Open Recent, Save, Save As, Close Tab
- Recent files + settings stored in `~/.med/`
- Mermaid diagrams render in the preview (theme follows light/dark)
- Registered as a **Markdown file handler** (`.md`, `.markdown`, `.mdx`) so you can set MED as the default app or use **Open With**
- Shortcuts: `⌘N` New · `⌘O` Open · `⌘S` Save · `⇧⌘S` Save As · `⌘W` Close tab
- Light / dark mode

## Colours

| Token        | Value                      |
|--------------|----------------------------|
| Light bg     | `#ede3cd` (warm parchment) |
| Dark bg      | `#1C1A15`                  |
| Primary      | `#F6821F` (orange)         |
| Editor light | `#f7f0e1`                  |
| Editor dark  | `#25221C`                  |

## Prerequisites (macOS)

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Xcode CLT (if needed)
xcode-select --install

# Node.js 18+
```

## Run in development

```bash
cd markdown-preview-app
npm install
npm run tauri dev
```

## Build release `.app` / `.dmg`

```bash
npm run tauri build
```

Output:

```
src-tauri/target/release/bundle/macos/
src-tauri/target/release/bundle/dmg/
```

After installing the `.app`, right-click any `.md` file → **Get Info** → **Open with** → choose **MED** → **Change All…** to set it as the default Markdown editor.

## Config location

```
~/.med/config.json   # theme, live-preview preference
~/.med/recent.json   # recent file paths
```

## Project layout

```
src/
├── App.jsx                 # screen switch + wiring
├── main.jsx
├── theme.js
├── components/
│   ├── HomeScreen.jsx      # Zed-style open + recent
│   ├── EditorScreen.jsx
│   ├── TabBar.jsx
│   ├── EditorPane.jsx
│   └── PreviewPane.jsx
├── hooks/
│   ├── useConfig.js
│   ├── useRecentFiles.js
│   ├── useDocuments.js
│   ├── useMarkdownPreview.js
│   └── useNativeMenu.js    # native File/Edit/View menu
└── lib/
    ├── markdown.js         # marked + mermaid
    ├── medStorage.js       # ~/.med/
    └── paths.js

src-tauri/                  # MED bundle, fileAssociations, Info.plist
```

No in-window toolbar — Open / Save / New / theme / live live in the **native menu bar**.
