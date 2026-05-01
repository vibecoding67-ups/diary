import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MOODS } from "@/lib/moods";

export interface EntryDraft {
  entryDate: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
}

interface EntryEditorProps {
  initial?: Partial<EntryDraft>;
  onSubmit: (draft: EntryDraft) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}

const today = () => format(new Date(), "yyyy-MM-dd");

export function EntryEditor({
  initial,
  onSubmit,
  onCancel,
  submitting,
  submitLabel = "Save entry",
}: EntryEditorProps) {
  const [entryDate, setEntryDate] = useState(initial?.entryDate ?? today());
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<string | null>(initial?.mood ?? null);
  const [tagsInput, setTagsInput] = useState((initial?.tags ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial?.entryDate) setEntryDate(initial.entryDate);
    if (initial?.title !== undefined) setTitle(initial.title);
    if (initial?.content !== undefined) setContent(initial.content);
    if (initial?.mood !== undefined) setMood(initial.mood);
    if (initial?.tags !== undefined) setTagsInput(initial.tags.join(", "));
  }, [initial?.entryDate, initial?.title, initial?.content, initial?.mood, initial?.tags?.join(",")]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Give today a title — even just a few words.");
      return;
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    await onSubmit({
      entryDate,
      title: title.trim(),
      content,
      mood,
      tags,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
        <div className="space-y-2">
          <Label htmlFor="entry-date">Date</Label>
          <Input
            id="entry-date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="entry-title">Title</Label>
          <Input
            id="entry-title"
            placeholder="A small headline for today…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-serif text-lg"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>How did today feel?</Label>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => {
            const active = mood === m.value;
            return (
              <button
                type="button"
                key={m.value}
                onClick={() => setMood(active ? null : m.value)}
                className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all hover-elevate active-elevate-2 ${
                  active
                    ? "border-transparent text-primary-foreground"
                    : "border-border bg-card"
                }`}
                style={
                  active
                    ? {
                        backgroundColor: `hsl(${m.color})`,
                      }
                    : undefined
                }
              >
                <span
                  className="h-2 w-2 rounded-full ring-2"
                  style={{
                    backgroundColor: `hsl(${m.color})`,
                    boxShadow: active
                      ? "0 0 0 2px hsl(var(--background) / .35)"
                      : undefined,
                  }}
                />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-content">The page</Label>
        <Textarea
          id="entry-content"
          placeholder="Write whatever the day asked for…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="prose-diary min-h-[260px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-tags">Tags</Label>
        <Input
          id="entry-tags"
          placeholder="work, family, ideas (comma separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onCancel}
            disabled={submitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
