import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { supabase } from "./supabase";

export interface Entry {
  id: string;
  entryDate: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EntryDraft {
  entryDate: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[];
}

export interface SummaryStats {
  totalEntries: number;
  entriesThisMonth: number;
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
}

export interface MoodStat { mood: string; count: number; }
export interface TagStat { tag: string; count: number; }
export interface CalendarCell { date: string; count: number; mood: string | null; }
export interface ListEntriesParams { q?: string; mood?: string; tag?: string; from?: string; to?: string; }

function serialize(row: any): Entry {
  return {
    id: row.id,
    entryDate: row.entry_date,
    title: row.title,
    content: row.content ?? "",
    mood: row.mood ?? null,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function computeStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };
  const sorted = Array.from(new Set(dates)).sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i]+"T00:00:00Z").getTime() - new Date(sorted[i-1]+"T00:00:00Z").getTime()) / 86400000);
    if (diff === 1) { run++; longest = Math.max(longest, run); } else run = 1;
  }
  const toStr = (d: Date) => d.toISOString().slice(0,10);
  const today = new Date();
  const set = new Set(sorted);
  let cursor: Date;
  if (set.has(toStr(today))) cursor = today;
  else if (set.has(toStr(new Date(today.getTime()-86400000)))) cursor = new Date(today.getTime()-86400000);
  else return { currentStreak: 0, longestStreak: longest };
  let current = 0;
  while (set.has(toStr(cursor))) { current++; cursor = new Date(cursor.getTime()-86400000); }
  return { currentStreak: current, longestStreak: Math.max(longest, current) };
}

type QueryOpts<T> = { query?: Partial<UseQueryOptions<T>> };
type MutationOpts<T, V> = { mutation?: Partial<UseMutationOptions<T, Error, V>> };

export const getListEntriesQueryKey = (p?: ListEntriesParams) => p ? ["/entries", p] : ["/entries"];
export const getGetEntryQueryKey = (id: string) => ["/entries", id];
export const getGetSummaryStatsQueryKey = () => ["/stats/summary"];
export const getGetMoodStatsQueryKey = (p?: { days?: number }) => p ? ["/stats/moods", p] : ["/stats/moods"];
export const getGetTopTagsQueryKey = (p?: { limit?: number }) => p ? ["/stats/tags", p] : ["/stats/tags"];
export const getGetCalendarHeatmapQueryKey = (p?: { year?: number }) => p ? ["/stats/calendar", p] : ["/stats/calendar"];

export function useListEntries(params?: ListEntriesParams, options?: QueryOpts<Entry[]>) {
  return useQuery<Entry[]>({
    queryKey: getListEntriesQueryKey(params),
    queryFn: async () => {
      let q = supabase.from("diary_entries").select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (params?.q) q = q.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`);
      if (params?.mood) q = q.eq("mood", params.mood);
      if (params?.tag) q = q.contains("tags", [params.tag]);
      if (params?.from) q = q.gte("entry_date", params.from);
      if (params?.to) q = q.lte("entry_date", params.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map(serialize);
    },
    ...options?.query,
  });
}

export function useGetEntry(id: string, options?: QueryOpts<Entry>) {
  return useQuery<Entry>({
    queryKey: getGetEntryQueryKey(id),
    queryFn: async () => {
      const { data, error } = await supabase.from("diary_entries").select("*").eq("id", id).single();
      if (error) throw error;
      return serialize(data);
    },
    ...options?.query,
  });
}

export function useCreateEntry(options?: MutationOpts<Entry, { data: EntryDraft }>) {
  return useMutation<Entry, Error, { data: EntryDraft }>({
    mutationFn: async ({ data }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: row, error } = await supabase.from("diary_entries")
        .insert({ user_id: user.id, entry_date: data.entryDate, title: data.title, content: data.content, mood: data.mood, tags: data.tags })
        .select().single();
      if (error) throw error;
      return serialize(row);
    },
    ...options?.mutation,
  });
}

export function useUpdateEntry(options?: MutationOpts<Entry, { id: string; data: Partial<EntryDraft> }>) {
  return useMutation<Entry, Error, { id: string; data: Partial<EntryDraft> }>({
    mutationFn: async ({ id, data }) => {
      const updates: any = {};
      if (data.entryDate !== undefined) updates.entry_date = data.entryDate;
      if (data.title !== undefined) updates.title = data.title;
      if (data.content !== undefined) updates.content = data.content;
      if (data.mood !== undefined) updates.mood = data.mood;
      if (data.tags !== undefined) updates.tags = data.tags;
      const { data: row, error } = await supabase.from("diary_entries").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return serialize(row);
    },
    ...options?.mutation,
  });
}

export function useDeleteEntry(options?: MutationOpts<void, { id: string }>) {
  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("diary_entries").delete().eq("id", id);
      if (error) throw error;
    },
    ...options?.mutation,
  });
}

export function useGetSummaryStats(options?: QueryOpts<SummaryStats>) {
  return useQuery<SummaryStats>({
    queryKey: getGetSummaryStatsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase.from("diary_entries").select("entry_date").order("entry_date", { ascending: false });
      if (error) throw error;
      const dates = (data ?? []).map((r: any) => r.entry_date as string);
      const { currentStreak, longestStreak } = computeStreaks(dates);
      const monthPrefix = new Date().toISOString().slice(0, 7);
      return {
        totalEntries: dates.length,
        entriesThisMonth: dates.filter(d => d.startsWith(monthPrefix)).length,
        currentStreak, longestStreak,
        lastEntryDate: dates[0] ?? null,
      };
    },
    ...options?.query,
  });
}

export function useGetMoodStats(params?: { days?: number }, options?: QueryOpts<MoodStat[]>) {
  return useQuery<MoodStat[]>({
    queryKey: getGetMoodStatsQueryKey(params),
    queryFn: async () => {
      const since = new Date(Date.now() - (params?.days ?? 30) * 86400000).toISOString().slice(0, 10);
      const { data, error } = await supabase.from("diary_entries").select("mood").gte("entry_date", since).not("mood", "is", null);
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((r: any) => { if (r.mood) counts.set(r.mood, (counts.get(r.mood) ?? 0) + 1); });
      return Array.from(counts.entries()).map(([mood, count]) => ({ mood, count }));
    },
    ...options?.query,
  });
}

export function useGetTopTags(params?: { limit?: number }, options?: QueryOpts<TagStat[]>) {
  return useQuery<TagStat[]>({
    queryKey: getGetTopTagsQueryKey(params),
    queryFn: async () => {
      const { data, error } = await supabase.from("diary_entries").select("tags");
      if (error) throw error;
      const counts = new Map<string, number>();
      (data ?? []).forEach((r: any) => { (r.tags ?? []).forEach((t: string) => counts.set(t, (counts.get(t) ?? 0) + 1)); });
      return Array.from(counts.entries()).map(([tag, count]) => ({ tag, count })).sort((a,b) => b.count - a.count || a.tag.localeCompare(b.tag)).slice(0, params?.limit ?? 10);
    },
    ...options?.query,
  });
}

export function useGetCalendarHeatmap(params?: { year?: number }, options?: QueryOpts<CalendarCell[]>) {
  return useQuery<CalendarCell[]>({
    queryKey: getGetCalendarHeatmapQueryKey(params),
    queryFn: async () => {
      const year = params?.year ?? new Date().getUTCFullYear();
      const { data, error } = await supabase.from("diary_entries").select("entry_date, mood").gte("entry_date", `${year}-01-01`).lte("entry_date", `${year}-12-31`);
      if (error) throw error;
      const byDate = new Map<string, { count: number; mood: string | null }>();
      (data ?? []).forEach((r: any) => {
        const cur = byDate.get(r.entry_date) ?? { count: 0, mood: null };
        cur.count++; if (r.mood) cur.mood = r.mood;
        byDate.set(r.entry_date, cur);
      });
      return Array.from(byDate.entries()).map(([date, v]) => ({ date, ...v }));
    },
    ...options?.query,
  });
}
