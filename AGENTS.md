# MED — Agent Guide

## Project Overview
Tauri 2 + React 19 + Mantine 9 desktop Markdown editor with live Mermaid preview.

## Package Manager
**pnpm only** (enforced by `packageManager` field in package.json). Never use npm/yarn.

## Commands
```bash
pnpm install          # install deps
pnpm tauri dev        # dev (starts Vite on :1420 + Tauri)
pnpm tauri build      # production build
```

## Architecture
- **Frontend**: `src/` — React + Mantine, Vite dev server on port 1420
- **Backend**: `src-tauri/` — Rust/Tauri 2, handles file system, dialogs, menu, window
- **Data**: `~/.med/` — config.json, recent.json, session.json

## Key Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Home ↔ Editor routing |
| `src/hooks/useDocuments.js` | Tab state + session restore |
| `src/hooks/useMarkdownPreview.js` | Marked + Mermaid rendering + cache |
| `src/hooks/useScrollSync.js` | Content-based scroll sync |
| `src/lib/markdown.js` | Marked + Mermaid config |
| `src-tauri/src/lib.rs` | Tauri commands: open, save, recent, session |
| `src-tauri/tauri.conf.json` | App config, file associations, CSP |

## Dev Workflow
1. `pnpm install`
2. `pnpm tauri dev` — single command runs Vite + Tauri
3. Edit React code in `src/`, Rust in `src-tauri/src/`

## Build Output (macOS)
```
src-tauri/target/release/bundle/macos/MED.app
src-tauri/target/release/bundle/dmg/MED_0.1.0.dmg
```

## File Associations
Registered for `.md`, `.markdown`, `.mdx` (see `tauri.conf.json` and `Info.plist`).

## Lint/Typecheck
No explicit lint/typecheck scripts in package.json. Rust: `cargo check` in `src-tauri/`.

## Testing
No test suite configured.

## Environment
- `.env` loaded by `tauri` script (see package.json `tauri` script)
- Vite env prefix: `VITE_`, `TAURI_`
- Requires Node 18+, Rust stable, Xcode CLI tools (macOS)