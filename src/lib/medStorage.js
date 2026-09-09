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

export async function loadRecent() {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "recent.json");
    if (!(await exists(file))) return [];
    const list = JSON.parse(await readTextFile(file));
    return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function saveRecent(list) {
  try {
    const dir = await ensureMedDir();
    const file = await join(dir, "recent.json");
    const unique = [...new Set(list)].slice(0, MAX_RECENT);
    await writeTextFile(file, JSON.stringify(unique, null, 2));
    return unique;
  } catch (e) {
    console.warn("save recent failed", e);
    return list;
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
