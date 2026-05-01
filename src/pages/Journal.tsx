import { useMemo, useState } from "react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import {
  Search,
  Plus,
  X,
  PenLine,
  ChevronRight,
} from "lucide-react";
import {
  useListEntries,
  useCreateEntry,
  getListEntriesQueryKey,
  getGetSummaryStatsQueryKey,
  getGetMoodStatsQueryKey,
  getGetTopTagsQueryKey,
  getGetCalendarHeatmapQueryKey,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOODS } from "@/lib/moods";
import { MoodChip } from "@/components/MoodChip";
import { EntryEditor, type EntryDraft } from "@/components/EntryEditor";

const ALL_MOODS = "all";
const ALL_TAGS = "all";

export function Journal() {
  const [q, setQ] = useState("");
  const [mood, setMood] = useState<string>(ALL_MOODS);
  const [tag, setTag] = useState<string>(ALL_TAGS);
  const [showEditor, setShowEditor] = useState(false);

  const params = useMemo(() => {
    const p: { q?: string; mood?: string; tag?: string } = {};
    if (q.trim()) p.q = q.trim();
    if (mood !== ALL_MOODS) p.mood = mood;
    if (tag !== ALL_TAGS) p.tag = tag;
    return p;
  }, [q, mood, tag]);

  const { data: entries, isLoading } = useListEntries(params, {
    query: { queryKey: getListEntriesQueryKey(params) },
  });

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (entries ?? []).forEach((e) => e.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [entries]);

  const queryClient = useQueryClient();
  const createEntry = useCreateEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMoodStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTopTagsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCalendarHeatmapQueryKey() });
        setShowEditor(false);
      },
    },
  });

  const handleCreate = async (draft: EntryDraft) => {
    await createEntry.mutateAsync({ data: draft });
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof entries>();
    (entries ?? []).forEach((e) => {
      const key = format(parseISO(e.entryDate), "MMMM yyyy");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr as typeof entries);
    });
    return Array.from(map.entries());
  }, [entries]);

  const hasFilters = Boolean(q) || mood !== ALL_MOODS || tag !== ALL_TAGS;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1">
            Your journal
          </h1>
        </div>
        <Button size="lg" onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New entry
        </Button>
      </div>

      <div className="paper-card rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search words and titles…"
            className="pl-9 bg-background"
          />
        </div>
        <Select value={mood} onValueChange={setMood}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Any mood" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_MOODS}>Any mood</SelectItem>
            {MOODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `hsl(${m.color})` }}
                  />
                  {m.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Any tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TAGS}>Any tag</SelectItem>
            {allTags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setQ("");
              setMood(ALL_MOODS);
              setTag(ALL_TAGS);
            }}
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="paper-card rounded-xl p-6 h-28 animate-pulse"
            />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <EmptyState onWrite={() => setShowEditor(true)} hasFilters={hasFilters} />
      ) : (
        <div className="space-y-8">
          {grouped.map(([month, items]) => (
            <div key={month}>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
                {month}
              </p>
              <div className="space-y-3">
                {(items ?? []).map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/entries/${entry.id}`}
                    className="block group"
                  >
                    <article className="paper-card rounded-xl p-5 hover-elevate transition-transform group-hover:-translate-y-0.5">
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-14 text-center">
                          <p className="font-serif text-2xl leading-none">
                            {format(parseISO(entry.entryDate), "d")}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                            {format(parseISO(entry.entryDate), "EEE")}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <h3 className="font-serif text-lg flex-1 truncate">
                              {entry.title}
                            </h3>
                            <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {entry.content ? (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {entry.content}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-1.5 mt-3">
                            <MoodChip mood={entry.mood ?? null} />
                            {entry.tags.slice(0, 4).map((t) => (
                              <span
                                key={t}
                                className="text-xs rounded-full border border-border px-2 py-0.5 text-muted-foreground bg-background"
                              >
                                {t}
                              </span>
                            ))}
                            {entry.tags.length > 4 ? (
                              <span className="text-xs text-muted-foreground">
                                +{entry.tags.length - 4}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              A new page
            </DialogTitle>
          </DialogHeader>
          <EntryEditor
            onSubmit={handleCreate}
            onCancel={() => setShowEditor(false)}
            submitting={createEntry.isPending}
            submitLabel="Save entry"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({
  onWrite,
  hasFilters,
}: {
  onWrite: () => void;
  hasFilters: boolean;
}) {
  if (hasFilters) {
    return (
      <div className="paper-card rounded-2xl p-12 text-center">
        <p className="font-serif text-xl mb-2">Nothing here yet</p>
        <p className="text-sm text-muted-foreground">
          No entries match those filters. Try widening your search.
        </p>
      </div>
    );
  }
  return (
    <div className="paper-card rounded-2xl p-12 text-center">
      <PenLine className="h-8 w-8 text-primary mx-auto mb-4" />
      <p className="font-serif text-2xl">Your first page is waiting.</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
        Even a sentence about today is enough. You can always come back
        and add more later.
      </p>
      <Button size="lg" className="mt-6" onClick={onWrite}>
        <Plus className="h-4 w-4 mr-2" />
        Write today
      </Button>
    </div>
  );
}
