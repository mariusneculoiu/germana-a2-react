import { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Shuffle, Volume2 } from "lucide-react";
import type { VocabEntry, CardLevel } from "@/types";
import { Flashcard } from "@/components/ui/Flashcard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { shuffle } from "@/lib/utils";
import { useSrs } from "@/hooks/useSrs";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  entries: VocabEntry[];
  onMark?: () => void;
}

type Direction = "ro-de" | "de-ro" | "random";

const vocabKey = (e: VocabEntry) => `${e.ro}::${e.de}`;

export function Flashcards({ entries, onMark }: Props) {
  const [direction, setDirection] = useState<Direction>("ro-de");
  const [order, setOrder] = useState<"sequential" | "shuffle">("sequential");
  const [shuffled, setShuffled] = useState<VocabEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const srs = useSrs<VocabEntry>(vocabKey);
  const { speak } = useTTS();

  // Build the active list based on order
  const list = useMemo(() => (order === "shuffle" ? shuffled : entries), [order, shuffled, entries]);

  // Reshuffle when entries change while in shuffle mode
  useEffect(() => {
    if (order === "shuffle") setShuffled(shuffle(entries));
    setIdx(0);
  }, [entries, order]);

  const next = useCallback(() => setIdx((i) => (list.length ? (i + 1) % list.length : 0)), [list.length]);
  const prev = useCallback(() => setIdx((i) => (list.length ? (i - 1 + list.length) % list.length : 0)), [list.length]);

  const reshuffle = () => {
    setOrder("shuffle");
    setShuffled(shuffle(entries));
    setIdx(0);
  };

  const handleMark = (level: CardLevel) => {
    const e = list[idx];
    if (!e) return;
    srs.mark(e, level);
    onMark?.();
    next();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.code === "ArrowRight") next();
      else if (e.code === "ArrowLeft") prev();
      else if (e.key === "1") handleMark("hard");
      else if (e.key === "2") handleMark("medium");
      else if (e.key === "3") handleMark("easy");
      else if (e.key.toLowerCase() === "a") {
        const cur = list[idx];
        if (cur) speak(cur.de);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, list]);

  if (!entries.length) {
    return <EmptyState title="Nicio sectiune activa" description="Activeaza sectiuni in tab-ul Sectiuni." />;
  }
  const current = list[idx];
  if (!current) return null;

  let useDir = direction;
  if (direction === "random") useDir = Math.random() < 0.5 ? "ro-de" : "de-ro";
  const front = useDir === "ro-de" ? current.ro : current.de;
  const back = useDir === "ro-de" ? current.de : current.ro;
  const status = srs.getState(current);
  const hint = status
    ? `Repetare #${status.reps} - interval ${status.interval} zile`
    : "Cuvant nou";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <span className="text-xs text-slate-500 mr-1">Directie:</span>
        {(["ro-de", "de-ro", "random"] as Direction[]).map((d) => (
          <Button
            key={d}
            size="sm"
            variant={direction === d ? "primary" : "ghost"}
            onClick={() => setDirection(d)}
            className="rounded-full"
          >
            {d === "ro-de" ? "RO → DE" : d === "de-ro" ? "DE → RO" : "Aleator"}
          </Button>
        ))}
        <span className="text-xs text-slate-500 ml-3 mr-1">Ordine:</span>
        <Button size="sm" variant={order === "sequential" ? "primary" : "ghost"} onClick={() => setOrder("sequential")} className="rounded-full">
          Originala
        </Button>
        <Button size="sm" variant={order === "shuffle" ? "primary" : "ghost"} onClick={() => setOrder("shuffle")} className="rounded-full">
          Amestecata
        </Button>
        <Button size="sm" variant="warning" onClick={reshuffle} className="rounded-full ml-auto">
          <Shuffle size={12} /> Re-shuffle
        </Button>
      </div>

      <Flashcard
        front={front}
        back={back}
        frontLabel={useDir === "ro-de" ? "Romana" : "Germana"}
        backLabel={useDir === "ro-de" ? "Germana" : "Romana"}
        category={current.section_ro}
        hint={hint}
        counter={`${idx + 1} / ${list.length}`}
        speakText={current.de}
      />

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button variant="secondary" onClick={prev} size="md"><ChevronLeft size={16} /> Anterior</Button>
        <Button variant="danger" onClick={() => handleMark("hard")}>Greu</Button>
        <Button variant="warning" onClick={() => handleMark("medium")}>Mediu</Button>
        <Button variant="success" onClick={() => handleMark("easy")}>Stiu!</Button>
        <Button variant="primary" onClick={next}>Urmator <ChevronRight size={16} /></Button>
        <Button variant="tts" onClick={() => speak(current.de)}><Volume2 size={14} /> Audio</Button>
      </div>
      <div className="text-center text-xs text-slate-400">SPACE = flip · Sageti = navigare · 1/2/3 = greu/mediu/usor · A = audio</div>
    </div>
  );
}
