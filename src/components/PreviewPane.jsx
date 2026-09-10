import { Box, ScrollArea, useMantineTheme } from "@mantine/core";

export default function PreviewPane({ html, previewRef, viewportRef, isDark, border, bg }) {
  const theme = useMantineTheme();
  const codeBg = isDark ? theme.other.codeDark : theme.other.codeLight;
  const text = isDark ? "#e8e8e8" : "#1a1a1a";
  const muted = isDark ? "#a0a0a0" : "#666666";

  return (
    <>
      <ScrollArea style={{ flex: 1, background: bg, minWidth: 0, height: "100%" }} type="auto" viewportRef={viewportRef}>
        <Box
          ref={previewRef}
          className={`markdown-body ${isDark ? "md-dark" : "md-light"}`}
          px="lg"
          py="md"
          maw={900}
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            color: text,
            fontSize: 14,
            lineHeight: 1.65,
          }}
        />
      </ScrollArea>
      <style>{`
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          border-bottom: 1px solid ${border};
          padding-bottom: 0.3em;
          margin-top: 1.4em;
          margin-bottom: 0.6em;
          color: ${text};
        }
        .markdown-body h1 { font-size: 1.75em; }
        .markdown-body h2 { font-size: 1.4em; }
        .markdown-body h3 { font-size: 1.15em; }
        .markdown-body p { margin: 0.75em 0; }
        .markdown-body a { color: #F6821F; }

        .markdown-body code {
          background: ${codeBg};
          color: ${text};
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: ${theme.fontFamilyMonospace};
        }

        .markdown-body pre.code-block,
        .markdown-body pre {
          background: ${codeBg};
          border: 1px solid ${border};
          border-radius: 8px;
          padding: 12px 14px;
          overflow: auto;
          margin: 1em 0;
        }
        .markdown-body pre code {
          background: transparent;
          padding: 0;
          color: ${text};
        }

        .md-dark .hljs-keyword,
        .md-dark .hljs-selector-tag,
        .md-dark .hljs-built_in { color: #ff7b72; }
        .md-dark .hljs-string,
        .md-dark .hljs-attr { color: #a5d6ff; }
        .md-dark .hljs-number,
        .md-dark .hljs-literal { color: #79c0ff; }
        .md-dark .hljs-comment { color: #8b949e; }
        .md-dark .hljs-title,
        .md-dark .hljs-section { color: #d2a8ff; }
        .md-dark .hljs-meta { color: #ffa657; }

        .md-light .hljs-keyword,
        .md-light .hljs-selector-tag,
        .md-light .hljs-built_in { color: #cf222e; }
        .md-light .hljs-string,
        .md-light .hljs-attr { color: #0a3069; }
        .md-light .hljs-number,
        .md-light .hljs-literal { color: #0550ae; }
        .md-light .hljs-comment { color: #6e7781; }
        .md-light .hljs-title,
        .md-light .hljs-section { color: #8250df; }
        .md-light .hljs-meta { color: #953800; }

        .markdown-body table { border-collapse: collapse; margin: 1em 0; width: 100%; }
        .markdown-body th, .markdown-body td {
          border: 1px solid ${border};
          padding: 6px 10px;
        }
        .markdown-body th { background: ${codeBg}; }
        .markdown-body blockquote {
          border-left: 4px solid #F6821F;
          padding-left: 1em;
          color: ${muted};
          margin: 1em 0;
        }
        .markdown-body ul, .markdown-body ol { padding-left: 1.6em; margin: 0.6em 0; }

        /*
         * Mermaid: hide raw source so users never see the text flash.
         * Reserve space with min-height; diagram fades in when ready.
         */
        .mermaid-src {
          background: ${codeBg};
          border: 1px solid ${border};
          border-radius: 10px;
          padding: 16px;
          margin: 1.2em 0;
          min-height: 96px;
          color: transparent;
          font-size: 0;
          overflow: hidden;
          position: relative;
        }
        .mermaid-src::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: linear-gradient(
            90deg,
            ${codeBg} 0%,
            ${isDark ? "#3a3a3a" : "#dedede"} 50%,
            ${codeBg} 100%
          );
          background-size: 200% 100%;
          animation: med-shimmer 1.1s ease-in-out infinite;
        }
        @keyframes med-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }

        .mermaid {
          background: ${codeBg};
          border: 1px solid ${border};
          border-radius: 10px;
          padding: 16px;
          margin: 1.2em 0;
          text-align: center;
          overflow-x: auto;
          animation: med-fade-in 0.15s ease-out;
        }
        @keyframes med-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mermaid svg { max-width: 100%; height: auto; }
        .mermaid-error {
          color: #e55;
          text-align: left;
          white-space: pre-wrap;
          margin: 0;
          font-size: 12px;
          color: #e55 !important;
          font-size: 12px !important;
        }
      `}</style>
    </>
  );
}
