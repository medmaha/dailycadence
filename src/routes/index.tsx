import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { Button, Card, Eyebrow, Screen } from "@/components/ui-kit";
import { EXERCISE_BY_ID, REGION_LABEL } from "@/lib/exercises";
import { generateWorkout } from "@/lib/generator";
import {
  computeStreak,
  todayKey,
  useActiveSession,
  useHistory,
  useProfile,
  useTodayWorkout,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today - Cadence home training" },
      {
        name: "description",
        content:
          "Cadence builds one adaptive home workout a day from what you trained recently. No equipment needed, works offline.",
      },
      { property: "og:title", content: "Today - Cadence home training" },
      {
        property: "og:description",
        content: "One adaptive home session a day, rotated so you never grind the same muscles twice.",
      },
    ],
  }),
  component: Today,
});

function Today() {
  const navigate = useNavigate();
  const [profile, , profileLoading] = useProfile();
  const [history, , historyLoading] = useHistory();
  const [workout, setWorkout, workoutLoading] = useTodayWorkout();
  const [active, , activeLoading] = useActiveSession();

  useEffect(() => {
    if (profileLoading || historyLoading) return;
    if (profile === null && history !== null) navigate({ to: "/onboarding" });
  }, [profile, history, navigate, profileLoading, historyLoading]);

  useEffect(() => {
    if (profileLoading || historyLoading || workoutLoading) return;
    if (!profile || !history) return;
    if (!workout || workout.date !== todayKey()) {
      setWorkout(generateWorkout(profile, history));
    }
  }, [profile, history, workout, setWorkout, profileLoading, historyLoading, workoutLoading]);

  const streak = useMemo(() => computeStreak(history ?? []), [history]);
  const doneToday = (history ?? []).some((h) => h.date === todayKey());

  if (profileLoading || workoutLoading || !profile || !workout) {
    return (
      <Screen>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-surface" />
        <div className="mt-6 h-56 animate-pulse rounded-2xl bg-surface" />
      </Screen>
    );
  }

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Screen>
      <header className="animate-rise">
        <Eyebrow>{dateLabel}</Eyebrow>
        <h1 className="mt-2 text-4xl font-semibold">
          {doneToday ? "Logged. Well done." : workout.kind === "recovery" ? "Ease off today." : "Ready when you are."}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {streak > 0 ? `${streak}-day streak` : "No streak yet"} ·{" "}
          {(history ?? []).length} sessions logged
        </p>
      </header>

      {workout.kind === "recovery" ? (
        <p className="mt-6 rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-muted-foreground animate-rise">
          You've had two demanding days close together, so today is deliberately light - mobility and
          blood flow instead of load.
        </p>
      ) : null}

      <Card className="mt-6 animate-rise">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>{workout.kind === "recovery" ? "Recovery" : "Today's session"}</Eyebrow>
            <h2 className="mt-2 text-2xl font-semibold">{workout.title}</h2>
          </div>
          <div className="text-right">
            <p className="tabular font-display text-2xl">{workout.estimatedMinutes}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {workout.regions.map((r) => (
            <span
              key={r}
              className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
            >
              {REGION_LABEL[r as keyof typeof REGION_LABEL]}
            </span>
          ))}
        </div>

        <ul className="mt-5 divide-y divide-border">
          {workout.items.map((item, i) => {
            const ex = EXERCISE_BY_ID.get(item.exerciseId);
            if (!ex) return null;
            return (
              <li key={item.exerciseId} className="flex items-baseline justify-between gap-3 py-3">
                <span className="flex items-baseline gap-3">
                  <span className="tabular text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm">{ex.name}</span>
                </span>
                <span className="tabular shrink-0 text-xs text-muted-foreground">
                  {item.sets} × {item.target}
                  {ex.unit === "seconds" ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ul>

        <Link to="/session" className="mt-6 block">
          <Button size="lg" className="w-full">
            {active ? "Resume session" : "Start"}
          </Button>
        </Link>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Built from your last {Math.min(7, (history ?? []).length)} sessions
        </p>
        <Button variant="ghost" onClick={() => setWorkout(generateWorkout(profile, history ?? []))}>
          Rebuild
        </Button>
      </div>
    </Screen>
  );
}
