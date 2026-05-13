import { useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { todayStr } from "@/lib/utils";

interface StreakState {
  count: number;
  lastDate: string | null;
}

export function useStreak() {
  const [state, setState] = useLocalStorage<StreakState>("germana_streak_v1", {
    count: 0,
    lastDate: null,
  });

  const bump = useCallback(() => {
    const today = todayStr();
    if (state.lastDate === today) return;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yest = y.toISOString().slice(0, 10);
    const newCount = state.lastDate === yest ? state.count + 1 : 1;
    setState({ count: newCount, lastDate: today });
  }, [state, setState]);

  const isActive = (() => {
    if (!state.lastDate) return false;
    const today = todayStr();
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yest = y.toISOString().slice(0, 10);
    return state.lastDate === today || state.lastDate === yest;
  })();

  return { count: state.count, isActive, bump };
}
