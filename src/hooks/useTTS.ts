import { useCallback, useEffect, useRef } from "react";

/**
 * Browser-native German TTS hook (no external API).
 * Uses speechSynthesis with a German voice when available.
 */
export function useTTS() {
  const germanVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      germanVoiceRef.current = voices.find((v) => v.lang.toLowerCase().startsWith("de")) ?? null;
    };
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (germanVoiceRef.current) u.voice = germanVoiceRef.current;
    u.lang = "de-DE";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }, []);

  return { speak };
}
