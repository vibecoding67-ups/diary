import { useMemo } from "react";
import {
  useGetSummaryStats,
  useGetMoodStats,
  useGetTopTags,
  getGetSummaryStatsQueryKey,
  getGetMoodStatsQueryKey,
  getGetTopTagsQueryKey,
} from "@/lib/api";
import { format, parseISO } from "date-fns";
import { Flame, BookOpen, CalendarDays, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { MOODS, getMood } from "@/lib/moods";

export function Stats() {
  const { data: summary } = useGetSummaryStats({
    query: { queryKey: getGetSummaryStatsQueryKey() },
  });
  const moodParams = { days: 30 };
  const { data: moods } = useGetMoodStats(moodParams, {
    query: { queryKey: getGetMoodStatsQueryKey(moodParams) },
  });
  const tagsParams = { limit: 12 };
  const { data: tags } = useGetTopTags(tagsParams, {
    query: { queryKey: getGetTopTagsQueryKey(tagsParams) },
  });

  const moodChartData = useMemo(() => {
    return MOODS.map((m) => ({
      mood: m.label,
      value: m.value,
      color: m.color,
      count: moods?.find((x) => x.mood === m.value)?.count ?? 0,
    })).filter((m) => m.count > 0);
  }, [moods]);

  const maxTagCount = (tags ?? []).reduce((acc, t) => Math.max(acc, t.count), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24 sm:pb-8">
        <p className="text-sm text-muted-foreground">A look back</p>
        <h1 className="font-serif text-3xl sm:text-4xl mt-1">Reflections</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={BookOpen}
          label="Total entries"
          value={summary?.totalEntries ?? 0}
        />
        <StatCard
          icon={CalendarDays}
          label="This month"
          value={summary?.entriesThisMonth ?? 0}
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={summary?.currentStreak ?? 0}
          suffix={summary?.currentStreak === 1 ? "day" : "days"}
          highlight
        />
        <StatCard
          icon={Sparkles}
          label="Longest streak"
          value={summary?.longestStreak ?? 0}
          suffix={summary?.longestStreak === 1 ? "day" : "days"}
        />
      </div>

      {summary?.lastEntryDate ? (
        <p className="text-sm text-muted-foreground mb-8 font-handwritten text-base">
          Last wrote on{" "}
          <span className="text-primary text-lg">
            {format(parseISO(summary.lastEntryDate), "EEEE, MMM d")}
          </span>
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="paper-card rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="font-serif text-xl">Moods, last 30 days</h2>
            <p className="text-xs text-muted-foreground mt-1">
              How the month felt, page by page
            </p>
          </header>
          {moodChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No mood data yet. Add a mood the next time you write.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="mood"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--accent))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {moodChartData.map((m) => (
                      <Cell key={m.value} fill={`hsl(${m.color})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="paper-card rounded-2xl p-6">
          <header className="mb-4">
            <h2 className="font-serif text-xl">What you keep returning to</h2>
            <p className="text-xs text-muted-foreground mt-1">
              The tags you reach for most
            </p>
          </header>
          {!tags || tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">
              No tags yet. Add a few to see your favourite topics here.
            </p>
          ) : (
            <ul className="space-y-3">
              {tags.map((t) => {
                const pct = maxTagCount > 0 ? (t.count / maxTagCount) * 100 : 0;
                return (
                  <li key={t.tag}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{t.tag}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {t.count}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 6)}%`,
                          backgroundColor: "hsl(var(--primary))",
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {moods && moods.length > 0 ? (
        <section className="paper-card rounded-2xl p-6 mt-6">
          <h2 className="font-serif text-xl mb-4">A small color story</h2>
          <p className="text-sm text-muted-foreground mb-4">
            One block per entry from the last 30 days, in the color of how you felt.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {moods.flatMap((m) => {
              const mood = getMood(m.mood);
              if (!mood) return [];
              return Array.from({ length: m.count }).map((_, i) => (
                <span
                  key={`${m.mood}-${i}`}
                  className="h-6 w-6 rounded-md"
                  style={{ backgroundColor: `hsl(${mood.color})` }}
                  title={mood.label}
                />
              ));
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  highlight,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="paper-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          {label}
        </p>
        <Icon
          className="h-4 w-4"
          style={{ color: highlight ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
        />
      </div>
      <p className="font-serif text-3xl tabular-nums">
        {value}
        {suffix ? (
          <span className="text-base text-muted-foreground font-sans ml-1.5">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}
