export const MOODS = [
  { value: "happy", label: "Happy", color: "var(--mood-happy)" },
  { value: "calm", label: "Calm", color: "var(--mood-calm)" },
  { value: "grateful", label: "Grateful", color: "var(--mood-grateful)" },
  { value: "excited", label: "Excited", color: "var(--mood-excited)" },
  { value: "tired", label: "Tired", color: "var(--mood-tired)" },
  { value: "anxious", label: "Anxious", color: "var(--mood-anxious)" },
  { value: "sad", label: "Sad", color: "var(--mood-sad)" },
  { value: "angry", label: "Angry", color: "var(--mood-angry)" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export function getMood(value?: string | null) {
  if (!value) return null;
  return MOODS.find((m) => m.value === value) ?? null;
}
