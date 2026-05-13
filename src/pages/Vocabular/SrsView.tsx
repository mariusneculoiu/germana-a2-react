import { useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import type { VocabEntry, CardLevel } from "@/types";
import { Button } from "@/components/ui/Button";
import { Flashcard } from "@/components/ui/Flashcard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useSrs } from "@/hooks/useSrs";
import { useTTS } from "@/hooks/useTTS";
import { Volume2 } from "lucide-react";

interface Props {
  entries: VocabEntry[];
  onMark?: () => void;
}

const vocabKey = (e: VocabEntry) => `${e.ro}::${e.de}`;

export function SrsView({ entries, onMark }: Props) {
  const srs = useSrs<VocabEntry>(vocabKey);
  const [direction, setDirection] = useState<"ro-de" | "de-ro">("ro-de");
  const [idx, setIdx] = useState(0);
  const { speak } = useTTS();

  // Compute due list from entries
  const due = useMemo(() => srs.getDue(entries), [entries, srs]);

  if (!due.length) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-10 text-center">
          <CalendarCheck size={48} className="text-emerald-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Toate cuvintele de azi sunt facute!</h3>
          <p className="text-sm text-emerald-700">Revino maine pentru urmatoarea sesiune SRS. Pana atunci, foloseste celelalte tab-uri.</p>
        </div>
      </div>
    );
  }

  const safeIdx = Math.min(idx, due.length - 1);
  const cur = due[safeIdx];

  const handleMark = (level: CardLevel) => {
    srs.mark(cur, level);
    onMark?.();
    // After marking, the next render will recompute `due` (likely smaller).
    // We keep idx the same; clamp will pick the next card.
    if (safeIdx >= due.length - 1) setIdx(0);
  };

  const front = direction === "ro-de" ? cur.ro : cur.de;
  const back = direction === "ro-de" ? cur.de : cur.ro;
  const state = srs.getState(cur);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm">
          <span className="font-semibold text-emerald-700">{due.length}</span>
          <span className="text-slate-500"> cuvinte de revizuit azi</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={direction === "ro-de" ? "primary" : "ghost"} onClick={() => setDirection("ro-de")} className="rounded-full">RO → DE</Button>
          <Button size="sm" variant={direction === "de-ro" ? "primary" : "ghost"} onClick={() => setDirection("de-ro")} className="rounded-full">DE → RO</Button>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-3 text-xs text-amber-900">
        Algoritm Anki: cuvintele apar la intervale care cresc cand le stii (3, 7, 17, 40+ zile). Greu = repeti maine.
      </div>

      <Flashcard
        front={front}
        back={back}
        frontLabel={direction === "ro-de" ? "Romana" : "Germana"}
        backLabel={direction === "ro-de" ? "Germana" : "Romana"}
        category={cur.section_ro}
        hint={state ? `Repetare #${state.reps} - interval ${state.interval} zile` : "Cuvant nou"}
        counter={`${safeIdx + 1} / ${due.length}`}
        speakText={cur.de}
      />

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button variant="danger" onClick={() => handleMark("hard")}>Greu (1 zi)</Button>
        <Button variant="warning" onClick={() => handleMark("medium")}>Mediu</Button>
        <Button variant="success" onClick={() => handleMark("easy")}>Stiu!</Button>
        <Button variant="tts" onClick={() => speak(cur.de)}><Volume2 size={14} /> Audio</Button>
      </div>
    </div>
  );
}
