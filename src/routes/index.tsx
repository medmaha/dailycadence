import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";

import { Screen } from "@/components/ui-kit";
import { TodayHeader } from "@/components/TodayHeader";
import { WorkoutCard } from "@/components/WorkoutCard";
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
      <TodayHeader
        dateLabel={dateLabel}
        doneToday={doneToday}
        workoutKind={workout.kind}
        streak={streak}
        sessionCount={(history ?? []).length}
      />

      <WorkoutCard
        workout={workout}
        hasActiveSession={!!active}
        onRebuild={() => setWorkout(generateWorkout(profile, history ?? []))}
        historyCount={(history ?? []).length}
      />
    </Screen>
  );
}
