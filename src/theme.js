import { createTheme } from "@mantine/core";

/**
 * Neutral greys + soft off-white (not pure #fff).
 * Primary accent remains orange.
 */
export const theme = createTheme({
  primaryColor: "orange",
  primaryShade: { light: 6, dark: 5 },

  colors: {
    orange: [
      "#FFF4E6",
      "#FFE8CC",
      "#FFD8A8",
      "#FFC078",
      "#FFA94D",
      "#FF922B",
      "#F6821F",
      "#E67700",
      "#D9480F",
      "#C22525",
    ],
    // Neutral dark greys
    dark: [
      "#e8e8e8",
      "#cfcfcf",
      "#a8a8a8",
      "#8a8a8a",
      "#6b6b6b",
      "#4a4a4a",
      "#333333",
      "#2a2a2a",
      "#1e1e1e",
      "#141414",
    ],
  },

  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  fontFamilyMonospace:
    '"SF Mono", "JetBrains Mono", "Fira Code", Menlo, Monaco, monospace',

  defaultRadius: "md",

  other: {
    // Soft off-white (not pure white)
    lightBg: "#f0f0f0",
    editorLight: "#f7f7f7",
    // Dark grey
    darkBg: "#1e1e1e",
    editorDark: "#2a2a2a",
    // Code blocks
    codeLight: "#e8e8e8",
    codeDark: "#333333",
    borderLight: "#d0d0d0",
    borderDark: "#404040",
  },
});
