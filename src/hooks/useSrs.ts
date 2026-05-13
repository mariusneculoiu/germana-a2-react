import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { todayDayNum } from "@/lib/utils";
import type { CardLevel, SrsState } from "@/types";

const STORAGE_KEY = "germana_srs_v2";

type SrsMap = Record<string, SrsState>;

/**
 * Anki-style SM-2 lite SRS.
 * @param keyFn Function mapping an item to a stable string key
 */
export function useSrs<T>(keyFn: (item: T) => string) {
  const [data, setData] = useLocalStorage<SrsMap>(STORAGE_KEY, {});

  const getState = useCallback(
    (item: T): SrsState | undefined => data[keyFn(item)],
    [data, keyFn]
  );

  const mark = useCallback(
    (item: T, level: CardLevel) => {
      const k = keyFn(item);
      const today = todayDayNum();
      setData((prev) => {
        const s: SrsState = prev[k] ?? { interval: 0, reps: 0, ease: 2.5, due: today, lastReviewed: 0 };
        const next: SrsState = { ...s };
        if (level === "hard") {
          next.interval = 1;
          next.reps = 0;
          next.ease = Math.max(1.3, next.ease - 0.2);
        } else if (level === "medium") {
          if (next.reps === 0 || next.interval === 0) next.interval = 2;
          else if (next.interval <= 3) next.interval = 4;
          else next.interval = Math.round(next.interval * 1.5);
          next.reps += 1;
        } else {
          if (next.reps === 0 || next.interval === 0) next.interval = 3;
          else if (next.interval <= 4) next.interval = 7;
          else next.interval = Math.round(next.interval * next.ease);
          next.reps += 1;
          next.ease = Math.min(3.0, next.ease + 0.1);
        }
        next.due = today + next.interval;
        next.lastReviewed = today;
        return { ...prev, [k]: next };
      });
    },
    [keyFn, setData]
  );

  const getDue = useCallback(
    (items: readonly T[]): T[] => {
      const today = todayDayNum();
      return items.filter((it) => {
        const s = data[keyFn(it)];
        return !s || s.due <= today;
      });
    },
    [data, keyFn]
  );

  const reset = useCallback(() => setData({}), [setData]);

  return { mark, getState, getDue, reset };
}
