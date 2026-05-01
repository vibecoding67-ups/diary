import { getMood } from "@/lib/moods";

interface MoodChipProps {
  mood: string | null | undefined;
  size?: "sm" | "md";
}

export function MoodChip({ mood, size = "sm" }: MoodChipProps) {
  const m = getMood(mood);
  if (!m) return null;
  const dot = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-card text-foreground ${padding}`}
    >
      <span
        className={`${dot} rounded-full`}
        style={{ backgroundColor: `hsl(${m.color})` }}
      />
      {m.label}
    </span>
  );
}
