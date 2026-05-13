import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combine Tailwind classes with proper precedence */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Fisher-Yates shuffle (non-mutating) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Day number since unix epoch (local time) */
export function todayDayNum(): number {
  const now = new Date();
  return Math.floor((now.getTime() - now.getTimezoneOffset() * 60000) / 86400000);
}

/** YYYY-MM-DD */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Normalize German text for comparison: lowercase, umlauts to ASCII equivalents, strip punctuation */
export function normalizeDE(s: string): string {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[.,!?;:"„"'()]/g, "")
    .replace(/\s+/g, " ");
}

/** Random integer 0..n-1 */
export function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

/** Pick random element */
export function pick<T>(arr: readonly T[]): T {
  return arr[randInt(arr.length)];
}

/** Strip punctuation from a single word */
export function stripPunct(w: string): string {
  return w.replace(/[.,!?;:"„"'()]/g, "");
}
