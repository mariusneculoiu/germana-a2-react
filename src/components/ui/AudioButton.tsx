import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTTS } from "@/hooks/useTTS";

interface Props {
  text: string;
  className?: string;
  size?: "sm" | "md";
  label?: string;
}

export function AudioButton({ text, className, size = "sm", label }: Props) {
  const { speak } = useTTS();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full font-medium transition-colors",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm",
        className
      )}
      title="Asculta pronuntia germana"
    >
      <Volume2 size={size === "sm" ? 12 : 16} />
      {label && <span>{label}</span>}
    </button>
  );
}
