import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { Card, Eyebrow, Screen, Stat } from "@/components/ui-kit";
import { REGION_LABEL } from "@/lib/exercises";
import { computeStreak, daysBetween, todayKey } from "@/lib/store";
import { useProfileHistory } from "@/hooks/profile";
import { Region } from "@/lib/types";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress - Cadence" },
      {
        name: "description",
        content: "Streak, session count, volume trend and body-part balance - only the numbers that change what you do next.",
      },
      { property: "og:title", content: "Progress - Cadence" },
      {
        property: "og:description",
        content: "See your streak, volume trend and which body parts you've been neglecting.",
      },
    ],
  }),
  component: Progress,
});

const REGIONS: Region[] = ["push", "pull", "legs", "core", "mobility", "cardio"];

function Progress() {
  const [history, , historyLoading] = useProfileHistory();
  const sessions = history ?? [];

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const last14 = useMemo(
    () => sessions.filter((s) => daysBetween(s.date, todayKey()) <= 13),
    [sessions],
  );

  const weeks = useMemo(() => {
    const buckets = [0, 0, 0, 0];
    for (const s of sessions) {
      const d = daysBetween(s.date, todayKey());
      if (d < 0 || d > 27) continue;
      { const k = 3 - Math.floor(d / 7); buckets[k] = (buckets[k] ?? 0) + s.volume; }
    }
    return buckets;
  }, [sessions]);
  const maxVolume = Math.max(1, ...weeks);

  const frequency = useMemo(() => {
    const counts = Object.fromEntries(REGIONS.map((r) => [r, 0])) as Record<Region, number>;
    for (const s of last14) for (const r of s.regions) counts[r as keyof typeof counts] += 1;
    return counts;
  }, [last14]);
  const maxFreq = Math.max(1, ...Object.values(frequency));

  if (historyLoading) {
    return (
      <Screen>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-56 animate-pulse rounded-2xl bg-surface" />
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="animate-rise">
        <Eyebrow>Progress</Eyebrow>
        <h1 className="mt-2 text-4xl font-semibold">The short version</h1>
      </header>

      <Card className="mt-6 animate-rise">
        <div className="grid grid-cols-3 gap-4">
          <Stat value={streak} label="day streak" />
          <Stat value={sessions.length} label="sessions" />
          <Stat value={sessions.reduce((m, s) => m + s.minutes, 0)} label="minutes trained" />
        </div>
      </Card>

      <section className="mt-8 animate-rise">
        <Eyebrow>Volume, last four weeks</Eyebrow>
        <div className="mt-4 flex h-32 items-end gap-3">
          {weeks.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-primary/80 transition-all"
                style={{ height: `${Math.max(3, (v / maxVolume) * 100)}%` }}
              />
              <span className="text-[0.7rem] text-muted-foreground">
                {i === 3 ? "now" : `−${3 - i}w`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 animate-rise">
        <Eyebrow>Body-part balance, last 14 days</Eyebrow>
        <ul className="mt-4 space-y-3">
          {REGIONS.map((r) => (
            <li key={r} className="flex items-center gap-4">
              <span className="w-28 shrink-0 text-sm text-muted-foreground">{REGION_LABEL[r]}</span>
              <span className="h-1.5 flex-1 rounded-full bg-surface-2">
                <span
                  className="block h-full origin-left animate-sweep rounded-full bg-primary"
                  style={{ width: `${(frequency[r] / maxFreq) * 100}%` }}
                />
              </span>
              <span className="tabular w-6 text-right text-sm">{frequency[r]}</span>
            </li>
          ))}
        </ul>
        {Object.entries(frequency).some(([, v]) => v === 0) ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Empty rows are what tomorrow's session will reach for first.
          </p>
        ) : null}
      </section>

      <section className="mt-10 animate-rise">
        <Eyebrow>Recent sessions</Eyebrow>
        {sessions.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {sessions.slice(0, 10).map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-3 py-3">
                <span>
                  <span className="text-sm">{s.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{s.date}</span>
                </span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">
                  {s.completedSets} sets · {s.minutes}m
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  );
}
