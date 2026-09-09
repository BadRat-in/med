import { useState, useEffect, useCallback } from "react";
import { loadRecent, saveRecent, MAX_RECENT } from "../lib/medStorage";

export function useRecentFiles() {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    loadRecent().then(setRecent);
  }, []);

  const pushRecent = useCallback(async (path) => {
    if (!path) return;
    setRecent((prev) => {
      const next = [path, ...prev.filter((p) => p !== path)].slice(0, MAX_RECENT);
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
