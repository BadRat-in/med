import { useState, useEffect, useCallback } from "react";
import { loadRecent, saveRecent, MAX_RECENT, normalizeRecentEntry } from "../lib/medStorage";

export function useRecentFiles() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    loadRecent().then(setRecent);
  }, []);

  const pushRecent = useCallback(async (path) => {
    if (!path) return;
    setRecent((prev) => {
      const entry = normalizeRecentEntry({
        path,
        lastOpened: Date.now(),
      });
      const next = [
        entry,
        ...prev.filter((p) => p.path !== path),
      ].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(async () => {
    setRecent([]);
    await saveRecent([]);
  }, []);

  return { recent, pushRecent, clearRecent, setRecent };
}
