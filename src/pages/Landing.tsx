import { Link } from "wouter";
import { Sparkles, BookHeart, CalendarRange, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BookHeart,
    title: "Write the day",
    body: "An unhurried place to put your thoughts. Date it, name it, leave a mood, save it.",
  },
  {
    icon: CalendarRange,
    title: "A year on one page",
    body: "See every day you wrote, colored by how you felt. Find any memory in two clicks.",
  },
  {
    icon: BarChart3,
    title: "Quiet reflection",
    body: "Streaks, moods over time, and the topics you keep returning to.",
  },
];

export function Landing() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[480px] -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.18), transparent 60%)",
        }}
      />

      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground mb-6">
          <Sparkles className="h-3 w-3 text-primary" />
          Your evening pages, kept warm
        </div>
        <h1 className="font-serif text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
          A diary that feels like
          <br />
          <span className="font-handwritten text-primary text-6xl sm:text-7xl">
            opening a worn notebook
          </span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
          Cozy Diary is a small private place to write about your day —
          mood, tags, search, and a year-at-a-glance calendar. No feed,
          no metrics, no audience. Just you and the page.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/sign-up">
            <Button size="lg" className="text-base">
              Start writing tonight
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="ghost" className="text-base">
              I have an account
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="paper-card rounded-2xl p-8 sm:p-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <p className="font-handwritten text-2xl text-primary leading-snug">
                Tuesday, Oct 14
              </p>
              <h3 className="font-serif text-2xl mt-1 mb-3">
                A walk after the rain
              </h3>
              <p className="prose-diary text-base">
                The street smelled like wet leaves and coffee from the
                bakery on the corner. I stayed out longer than I needed
                to — the kind of long that felt like a small gift to
                myself. Tomorrow I want to remember this part.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "hsl(170 30% 50%)" }}
                  />
                  Calm
                </span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  walks
                </span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  autumn
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 * 8 }).map((_, i) => {
                const intensity = [0, 0.1, 0.25, 0.5, 0.75, 1][i % 6];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-sm border border-border"
                    style={{
                      backgroundColor: `hsl(var(--primary) / ${intensity})`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="paper-card rounded-xl p-6">
                <Icon className="h-5 w-5 text-primary mb-3" />
                <h4 className="font-serif text-lg mb-1">{f.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground">
        Made for the kind of evening that asks for tea and a pen.
      </footer>
    </div>
  );
}
