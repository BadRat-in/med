import { marked } from "marked";
import hljs from "highlight.js";
import mermaid from "mermaid";

export const WELCOME_MD = `# Welcome to MED

**Markdown Editor** — edit and preview side by side.

\`\`\`mermaid
graph TD
  A[Open a file] --> B[Edit Markdown]
  B --> C[Live preview]
  C --> D[Mermaid diagrams]
\`\`\`

Tips:
- **File → Open** or ⌘/Ctrl+O
- Multiple files open as tabs
- Recent files appear on the home screen
- Config lives in \`~/.med/\`
`;

let mermaidReady = false;

export function initMermaid(isDark) {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    securityLevel: "loose",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    themeVariables: isDark
      ? {
          darkMode: true,
          background: "#2a2a2a",
          primaryColor: "#F6821F",
          primaryTextColor: "#e8e8e8",
          primaryBorderColor: "#FF922B",
          secondaryColor: "#3d8b40",
          tertiaryColor: "#6e40c9",
          mainBkg: "#333333",
          nodeBorder: "#F6821F",
          clusterBkg: "#222222",
          clusterBorder: "#555555",
          titleColor: "#e8e8e8",
          lineColor: "#aaaaaa",
          edgeLabelBackground: "#333333",
          textColor: "#e8e8e8",
          fontSize: "14px",
        }
      : {
          background: "#f4f4f4",
          primaryColor: "#F6821F",
          primaryTextColor: "#1a1a1a",
          primaryBorderColor: "#E67700",
          mainBkg: "#fafafa",
          nodeBorder: "#F6821F",
          clusterBkg: "#eeeeee",
          clusterBorder: "#cccccc",
          titleColor: "#1a1a1a",
          lineColor: "#666666",
          textColor: "#1a1a1a",
          fontSize: "14px",
        },
    flowchart: {
      curve: "basis",
      padding: 16,
      nodeSpacing: 40,
      rankSpacing: 50,
      htmlLabels: true,
    },
  });
  mermaidReady = true;
}

const renderer = new marked.Renderer();
renderer.code = (token) => {
  // marked ≥14: token is { text, lang, escaped, ... }
  const lang = (token?.lang || "").trim().split(/\s+/)[0] || "";
  const text = typeof token === "string" ? token : token?.text ?? "";

  if (lang === "mermaid") {
    // Keep source as text only — no HTML tags that the browser would parse.
    // Encode so accidental < in diagrams never break the DOM; browser textContent
    // will still give mermaid the real source after we decode below.
    const safe = String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<div class="mermaid-src" data-mermaid="1">${safe}</div>\n`;
  }

  let highlighted;
  try {
    if (lang && hljs.getLanguage(lang)) {
      highlighted = hljs.highlight(text, { language: lang }).value;
    } else {
      highlighted = hljs.highlightAuto(text).value;
    }
  } catch {
    highlighted = String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  const cls = lang ? `hljs language-${lang}` : "hljs";
  return `<pre class="code-block"><code class="${cls}">${highlighted}</code></pre>\n`;
};

marked.setOptions({ gfm: true, breaks: true, async: false });
marked.use({ renderer });

/**
 * Parse markdown and stamp data-line (1-based) on each top-level block
 * so editor ↔ preview scroll can align by source content, not pane height.
 */
export function parseMarkdown(content) {
  const src = content || "";
  if (!src) return "";

  const tokens = marked.lexer(src);
  let searchFrom = 0;
  let html = "";

  for (const token of tokens) {
    if (token.type === "space") {
      html += marked.parser([token]);
      continue;
    }

    const raw = token.raw ?? "";
    let idx = raw ? src.indexOf(raw, searchFrom) : searchFrom;
    if (idx < 0) idx = searchFrom;
    const line = src.slice(0, idx).split("\n").length; // 1-based
    searchFrom = idx + (raw.length || 0);

    let piece = marked.parser([token]);
    // Annotate the first opening tag of this block
    piece = piece.replace(/^(\s*)<([a-zA-Z][a-zA-Z0-9]*)/, `$1<$2 data-line="${line}"`);
    html += piece;
  }

  return html;
}

/**
 * Render every pending mermaid block inside container.
 * Uses mermaid.render() per-node (more reliable than mermaid.run with React).
 */
export async function runMermaid(container) {
  if (!container || !mermaidReady) return;

  const nodes = [...container.querySelectorAll("[data-mermaid]:not([data-processed])")];
  if (!nodes.length) return;

  for (const node of nodes) {
    // Decode entities back to diagram source
    const definition = (node.textContent || "")
      .replace(/\u00a0/g, " ")
      .trim();
    if (!definition) {
      node.dataset.processed = "true";
      continue;
    }

    try {
      const id = `mmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const { svg } = await mermaid.render(id, definition);
      node.innerHTML = svg;
      node.dataset.processed = "true";
      node.removeAttribute("data-mermaid");
      node.classList.add("mermaid");
      node.classList.remove("mermaid-src");
    } catch (e) {
      console.warn("Mermaid error", e);
      node.dataset.processed = "true";
      node.innerHTML = `<pre class="mermaid-error">${String(e?.str || e?.message || e)}</pre>`;
    }
  }
}
