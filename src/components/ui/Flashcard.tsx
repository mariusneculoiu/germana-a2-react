import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AudioButton } from "./AudioButton";

interface Props {
  front: string;
  back: string;
  frontLabel: string;
  backLabel: string;
  category?: string;
  hint?: string;
  counter?: string;
  speakText?: string; // German text to speak (defaults to back if back is German)
}

export function Flashcard({ front, back, frontLabel, backLabel, category, hint, counter, speakText }: Props) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when content changes
  useEffect(() => setFlipped(false), [front, back]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="perspective-1000 cursor-pointer select-none"
        onClick={() => setFlipped((f) => !f)}
        style={{ aspectRatio: "5/3" }}
      >
        <motion.div
          className="relative w-full h-full preserve-3d"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-3xl shadow-xl shadow-blue-200/50 p-8 flex flex-col items-center justify-center text-center text-white">
            {category && (
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                {category}
              </span>
            )}
            {counter && (
              <span className="absolute top-4 left-4 text-xs text-white/80">{counter}</span>
            )}
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 mb-3">{frontLabel}</div>
            <h3 className="text-3xl md:text-4xl font-semibold leading-tight">{front}</h3>
            <div className="mt-6 text-xs text-white/70 italic">Click pentru raspuns - SPACE pentru flip</div>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 rounded-3xl shadow-xl shadow-pink-200/50 p-8 flex flex-col items-center justify-center text-center text-white"
            style={{ transform: "rotateY(180deg)" }}
          >
            {category && (
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                {category}
              </span>
            )}
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/80 mb-3">{backLabel}</div>
            <h3 className="text-3xl md:text-4xl font-semibold leading-tight">{back}</h3>
            {hint && <div className="mt-4 text-xs text-white/85 italic max-w-md">{hint}</div>}
            {speakText && (
              <div className="mt-5">
                <AudioButton text={speakText} size="md" label="Asculta" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <style>{`
        .perspective-1000 { perspective: 1200px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}
