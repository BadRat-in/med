export function basename(p) {
  if (!p) return "Untitled";
  const parts = String(p).replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || p;
}

export function dirname(p) {
  if (!p) return "";
  const norm = String(p).replace(/\\/g, "/");
  const i = norm.lastIndexOf("/");
  return i >= 0 ? norm.slice(0, i) : "";
}

/**
 * Display path with home directory collapsed to ~/.
 * Works with POSIX (/Users/x/...) and Windows (C:\Users\x\...).
 */
export function toTildePath(p, home) {
  if (!p) return "";
  const norm = String(p).replace(/\\/g, "/");
  if (!home) return norm;
  const homeNorm = String(home).replace(/\\/g, "/").replace(/\/+$/, "");
  if (norm === homeNorm) return "~";
  if (norm.startsWith(homeNorm + "/")) {
    return "~" + norm.slice(homeNorm.length);
  }
  // Case-insensitive fallback (macOS / Windows)
  const lower = norm.toLowerCase();
  const homeLower = homeNorm.toLowerCase();
  if (lower === homeLower) return "~";
  if (lower.startsWith(homeLower + "/")) {
    return "~" + norm.slice(homeNorm.length);
  }
  return norm;
}
