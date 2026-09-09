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
