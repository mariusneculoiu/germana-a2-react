import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Shuffle, Volume2 } from "lucide-react";
import type { Phrase, CardLevel } from "@/types";
import { Flashcard } from "@/components/ui/Flashcard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { shuffle as shuffleArr } from "@/lib/utils";
import { useSrs } from "@/hooks/useSrs";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  phrases: Phrase[];
  onAction?: () => void;
}

const phraseKey = (p: Phrase) => `fra::${p.id}`;

export function FraFlashcards({ phrases, onAction }: Props) {
  const [direction, setDirection] = useState<"de-ro" | "ro-de">("de-ro");
  const [order, setOrder] = useState<"sequential" | "shuffle">("sequential");
  const [shuffled, setShuffled] = useState<Phrase[]>([]);
  const [idx, setIdx] = useState(0);
  const srs = useSrs<Phrase>(phraseKey);
  const { speak } = useTTS();

  const list = useMemo(() => (order === "shuffle" ? shuffled : phrases), [order, shuffled, phrases]);

  useEffect(() => {
    if (order === "shuffle") setShuffled(shuffleArr(phrases));
    setIdx(0);
  }, [phrases, order]);

  if (!phrases.length) return <EmptyState title="Nicio fraza" description="Schimba categoria pentru a vedea fraze." />;
  const cur = list[idx];
  if (!cur) return null;

  const front = direction === "de-ro" ? cur.de : cur.ro;
  const back = direction === "de-ro" ? cur.ro : cur.de;

  const handleMark = (level: CardLevel) => {
    srs.mark(cur, level);
    onAction?.();
    setIdx((i) => (i + 1) % list.length);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <span className="text-xs text-slate-500 mr-1">Directie:</span>
        {(["de-ro", "ro-de"] as const).map((d) => (
          <Button key={d} size="sm" variant={direction === d ? "primary" : "ghost"} onClick={() => setDirection(d)} className="rounded-full">
            {d === "de-ro" ? "DE → RO" : "RO → DE"}
          </Button>
        ))}
        <span className="text-xs text-slate-500 ml-3 mr-1">Ordine:</span>
        <Button size="sm" variant={order === "sequential" ? "primary" : "ghost"} onClick={() => setOrder("sequential")} className="rounded-full">Originala</Button>
        <Button size="sm" variant={order === "shuffle" ? "primary" : "ghost"} onClick={() => setOrder("shuffle")} className="rounded-full">Amestecata</Button>
        <Button size="sm" variant="warning" onClick={() => { setOrder("shuffle"); setShuffled(shuffleArr(phrases)); setIdx(0); }} className="rounded-full">
          <Shuffle size={12} /> Re-shuffle
        </Button>
      </div>

      <Flashcard
        front={front}
        back={back}
        frontLabel={direction === "de-ro" ? "Germana" : "Romana"}
        backLabel={direction === "de-ro" ? "Romana" : "Germana"}
        category={cur.cat}
        hint={cur.grammar}
        counter={`${idx + 1} / ${list.length}`}
        speakText={cur.de}
      />

      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Button variant="secondary" onClick={() => setIdx((i) => (i - 1 + list.length) % list.length)}>
          <ChevronLeft size={16} /> Anterior
        </Button>
        <Button variant="danger" onClick={() => handleMark("hard")}>Greu</Button>
        <Button variant="warning" onClick={() => handleMark("medium")}>Mediu</Button>
        <Button variant="success" onClick={() => handleMark("easy")}>Stiu!</Button>
        <Button variant="primary" onClick={() => setIdx((i) => (i + 1) % list.length)}>Urmator <ChevronRight size={16} /></Button>
        <Button variant="tts" onClick={() => speak(cur.de)}><Volume2 size={14} /> Audio</Button>
      </div>
    </div>
  );
}
