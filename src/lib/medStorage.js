import { homeDir, join } from "@tauri-apps/api/path";
import { readTextFile, writeTextFile, mkdir, exists } from "@tauri-apps/plugin-fs";

export const MAX_RECENT = 12;

export async function getMedDir() {
  const home = await homeDir();
  return join(home, ".med");
}

export async function ensureMedDir() {
  const dir = await getMedDir();
  try {
    if (!(await exists(dir))) {
      await mkdir(dir, { recursive: true });
    }
  } catch (e) {
    console.warn("mkdir ~/.med failed", e);
  }
  return dir;
}

/** Normalize legacy string entries → { path, lastOpened } */
export function normalizeRecentEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string") {
    return { path: entry, lastOpened: Date.now() };
  }
  if (typeof entry === "object" && typeof entry.path === "string") {
    return {
      path: entry.path,
      lastOpened: entry.lastOpened || Date.now(),
      // keep any future fields
      ...entry,
      path: entry.path,
    };
  }
  return null;
}

export async function loadRecent() {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "recent.json");
    if (!(await exists(file))) return [];
    const list = JSON.parse(await readTextFile(file));
    if (!Array.isArray(list)) return [];
    const normalized = list
      .map(normalizeRecentEntry)
      .filter(Boolean);
    // Dedupe by path, keep first (most recent)
    const seen = new Set();
    const unique = [];
    for (const item of normalized) {
      if (seen.has(item.path)) continue;
      seen.add(item.path);
      unique.push(item);
    }
    return unique.slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export async function saveRecent(list) {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "recent.json");
    const normalized = (list || [])
      .map(normalizeRecentEntry)
      .filter(Boolean);
    const seen = new Set();
    const unique = [];
    for (const item of normalized) {
      if (seen.has(item.path)) continue;
      seen.add(item.path);
      unique.push(item);
    }
    const trimmed = unique.slice(0, MAX_RECENT);
    await writeTextFile(file, JSON.stringify(trimmed, null, 2));
    return trimmed;
  } catch (e) {
    console.warn("save recent failed", e);
    return list;
  }
}

/**
 * Session: which files were open last quit.
 * { paths: string[], activePath: string | null }
 */
export async function loadSession() {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "session.json");
    if (!(await exists(file))) return { paths: [], activePath: null };
    const data = JSON.parse(await readTextFile(file));
    const paths = Array.isArray(data?.paths)
      ? data.paths.filter((p) => typeof p === "string")
      : [];
    const activePath =
      typeof data?.activePath === "string" ? data.activePath : null;
    return { paths, activePath };
  } catch {
    return { paths: [], activePath: null };
  }
}

export async function saveSession(session) {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "session.json");
    const payload = {
      paths: Array.isArray(session?.paths) ? session.paths.filter(Boolean) : [],
      activePath: session?.activePath || null,
    };
    await writeTextFile(file, JSON.stringify(payload, null, 2));
  } catch (e) {
    console.warn("save session failed", e);
  }
}

export async function loadConfig() {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "config.json");
    if (!(await exists(file))) return {};
    return JSON.parse(await readTextFile(file));
  } catch {
    return {};
  }
}

export async function saveConfig(cfg) {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "config.json");
    await writeTextFile(file, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.warn("save config failed", e);
  }
}
