import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  format,
  parseISO,
  startOfYear,
  addDays,
  getDay,
  startOfMonth,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetCalendarHeatmap,
  getGetCalendarHeatmapQueryKey,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { getMood, MOODS } from "@/lib/moods";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function CalendarPage() {
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);

  const params = { year };
  const { data, isLoading } = useGetCalendarHeatmap(params, {
    query: { queryKey: getGetCalendarHeatmapQueryKey(params) },
  });

  const byDate = useMemo(() => {
    const m = new Map<string, { count: number; mood: string | null | undefined }>();
    (data ?? []).forEach((d) => m.set(d.date, { count: d.count, mood: d.mood }));
    return m;
  }, [data]);

  // Build days starting from Sunday on or before Jan 1
  const cells = useMemo(() => {
    const start = startOfYear(new Date(Date.UTC(year, 0, 1)));
    const startWeekday = getDay(start); // 0 = Sun
    const cellStart = addDays(start, -startWeekday);
    // 53 weeks of 7 days = 371
    return Array.from({ length: 53 * 7 }).map((_, i) => addDays(cellStart, i));
  }, [year]);

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    for (let week = 0; week < 53; week++) {
      const d = cells[week * 7];
      if (!d) continue;
      if (d.getUTCFullYear() !== year) continue;
      const isFirstWeekOfMonth = isSameMonth(d, startOfMonth(d));
      const monthStart = startOfMonth(d);
      const diff = (monthStart.getTime() - d.getTime()) / 86400000;
      if (isFirstWeekOfMonth && diff >= 0 && diff < 7) {
        labels.push({ col: week, label: MONTHS[d.getUTCMonth()]! });
      }
    }
    return labels;
  }, [cells, year]);

  const totalEntries = (data ?? []).reduce((acc, d) => acc + d.count, 0);
  const daysWritten = (data ?? []).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">A year in pages</p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1">{year}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums w-16 text-center">
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            disabled={year >= currentYear}
            onClick={() => setYear((y) => y + 1)}
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="paper-card rounded-2xl p-5 sm:p-8 overflow-x-auto">
        {isLoading ? (
          <div className="h-[180px] animate-pulse" />
        ) : (
          <>
            <div className="flex gap-1 ml-8 mb-2 text-[10px] uppercase tracking-widest text-muted-foreground relative h-3">
              {monthLabels.map((m) => (
                <span
                  key={`${m.col}-${m.label}`}
                  style={{ position: "absolute", left: `${m.col * 16}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-1 pt-0.5">
                <span>Sun</span>
                <span></span>
                <span>Tue</span>
                <span></span>
                <span>Thu</span>
                <span></span>
                <span>Sat</span>
              </div>
              <div
                className="grid grid-flow-col grid-rows-7 gap-1"
                style={{ gridAutoColumns: "12px" }}
              >
                {cells.map((d, i) => {
                  const dateStr = format(d, "yyyy-MM-dd");
                  const inYear = d.getUTCFullYear() === year;
                  const cell = byDate.get(dateStr);
                  const m = getMood(cell?.mood ?? null);
                  const intensity = cell ? Math.min(0.85, 0.35 + cell.count * 0.2) : 0;
                  const bg = !inYear
                    ? "transparent"
                    : cell
                      ? m
                        ? `hsl(${m.color} / ${intensity})`
                        : `hsl(var(--primary) / ${intensity})`
                      : `hsl(var(--muted))`;
                  const cellEl = (
                    <div
                      key={i}
                      title={
                        inYear
                          ? cell
                            ? `${format(d, "MMM d")} — ${cell.count} entr${cell.count === 1 ? "y" : "ies"}${m ? ` (${m.label})` : ""}`
                            : format(d, "MMM d")
                          : ""
                      }
                      className="h-3 w-3 rounded-sm border border-border/40"
                      style={{ backgroundColor: bg, opacity: inYear ? 1 : 0 }}
                    />
                  );
                  return cell && inYear ? (
                    <Link key={i} href={`/journal?date=${dateStr}`}>{cellEl}</Link>
                  ) : (
                    cellEl
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{daysWritten}</span>{" "}
                days written ·{" "}
                <span className="text-foreground font-medium">{totalEntries}</span>{" "}
                total entries this year
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {MOODS.map((mood) => (
                  <span
                    key={mood.value}
                    className="inline-flex items-center gap-1.5"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: `hsl(${mood.color})` }}
                    />
                    {mood.label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {data && data.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            Recent days
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...data]
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 6)
              .map((d) => {
                const m = getMood(d.mood ?? null);
                return (
                  <Link
                    key={d.date}
                    href={`/journal?date=${d.date}`}
                    className="paper-card rounded-xl p-4 hover-elevate flex items-center gap-3"
                  >
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center font-serif text-lg"
                      style={{
                        backgroundColor: m ? `hsl(${m.color} / 0.18)` : "hsl(var(--accent))",
                        color: m ? `hsl(${m.color})` : "hsl(var(--primary))",
                      }}
                    >
                      {format(parseISO(d.date), "d")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {format(parseISO(d.date), "EEEE, MMM d")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.count} entr{d.count === 1 ? "y" : "ies"}{" "}
                        {m ? `· ${m.label.toLowerCase()}` : ""}
                      </p>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
