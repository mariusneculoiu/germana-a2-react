import { useCallback, useEffect, useState } from "react";

/**
 * Persistent state synced to localStorage.
 * @param key Storage key
 * @param initial Initial value (or factory)
 */
export function useLocalStorage<T>(key: string, initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw) as T;
    } catch {
      // ignore
    }
    return typeof initial === "function" ? (initial as () => T)() : initial;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage full or disabled - ignore
    }
  }, [key, state]);

  const update = useCallback((v: T | ((prev: T) => T)) => {
    setState((prev) => (typeof v === "function" ? (v as (p: T) => T)(prev) : v));
  }, []);

  return [state, update];
}
