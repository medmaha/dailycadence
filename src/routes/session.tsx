import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Screen } from "@/components/ui-kit";
import { SessionSummary } from "@/components/session/SessionSummary";
import { RestTimer } from "@/components/session/RestTimer";
import { ExerciseDetail } from "@/components/session/ExerciseDetail";
import {
  alternativesFor,
  EXERCISE_BY_ID,
  REGION_LABEL,
} from "@/lib/exercises";
import {
  saveSession,
  todayKey,
  useActiveSession,
  useProfile,
  useTodayWorkout,
} from "@/lib/store";
import type { Exercise, ActiveSession } from "@/lib/types";

export const Route = createFileRoute("/session")({
  head: () => ({
    meta: [
      { title: "Session - Cadence" },
      {
        name: "description",
        content: "Guided home workout with rest timers, set logging and instant exercise swaps. Works offline.",
      },
      { property: "og:title", content: "Session - Cadence" },
      {
        property: "og:description",
        content: "Guided sets, rest timers and one-tap substitutions - all offline.",
      },
    ],
  }),
  component: SessionRoute,
});

function SessionRoute() {
  const navigate = useNavigate();
  const [profile] = useProfile();
  const [workout, setWorkout, workoutLoading] = useTodayWorkout();
  const [active, setActive, activeLoading] = useActiveSession();
  const [finished, setFinished] = useState<null | { minutes: number; sets: number; volume: number }>(
    null,
  );

  // Boot / resume
  useEffect(() => {
    if (workoutLoading || activeLoading) return;
    if (!workout) return;
    if (!active || active.workout.id !== workout.id) {
      setActive({ workout, startedAt: Date.now(), index: 0, logs: {} });
    }
  }, [workout, active, setActive, workoutLoading, activeLoading]);

  const current = active?.workout.items[active.index];
  const exercise = current ? EXERCISE_BY_ID.get(current.exerciseId) : undefined;
  const logs = current ? (active?.logs[current.exerciseId] ?? []) : [];
  const setNumber = Math.min(logs.filter((l) => l.done).length + 1, current?.sets ?? 1);

  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [rpe, setRpe] = useState("");
  const [rest, setRest] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setReps(current && exercise ? String(current.target) : "");
    setRpe("");
    setSwapOpen(false);
  }, [current?.exerciseId, exercise, current]);

  useEffect(() => {
    if (rest <= 0) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [rest > 0]);

  const patch = useCallback(
    (next: Partial<ActiveSession>) => {
      if (!active) return;
      setActive({ ...active, ...next });
    },
    [active, setActive],
  );

  const finishWorkout = useCallback(
    (session: ActiveSession) => {
      const entries = Object.entries(session.logs).map(([exerciseId, sets]) => ({
        exerciseId,
        sets: sets.filter((s) => s.done),
      }));
      const completedSets = entries.reduce((n, e) => n + e.sets.length, 0);
      const volume = entries.reduce(
        (v, e) => v + e.sets.reduce((s, set) => s + (set.reps ?? 0) * Math.max(1, set.weight ?? 1), 0),
        0,
      );
      const minutes = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000));
      saveSession({
        id: session.workout.id,
        date: todayKey(),
        title: session.workout.title,
        kind: session.workout.kind,
        regions: session.workout.regions,
        intensity: session.workout.intensity,
        minutes,
        volume,
        completedSets,
        entries,
      });
      setActive(null);
      setFinished({ minutes, sets: completedSets, volume });
    },
    [setActive],
  );

  const completeSet = () => {
    if (!active || !current || !exercise) return;
    const entry: SetLog = {
      reps: reps ? Number(reps) : undefined,
      weight: weight ? Number(weight) : undefined,
      rpe: rpe ? Number(rpe) : undefined,
      done: true,
    };
    const nextLogs = { ...active.logs, [current.exerciseId]: [...logs, entry] };
    const setsDone = (nextLogs[current.exerciseId] ?? []).filter((l) => l.done).length;
    const lastExercise = active.index >= active.workout.items.length - 1;

    if (setsDone >= current.sets) {
      if (lastExercise) {
        finishWorkout({ ...active, logs: nextLogs });
        return;
      }
      setActive({ ...active, logs: nextLogs, index: active.index + 1 });
      setRest(current.rest);
    } else {
      setActive({ ...active, logs: nextLogs });
      setRest(current.rest);
    }
  };

  const substitute = (alt: Exercise) => {
    if (!active || !current) return;
    const items = active.workout.items.map((it, i) =>
      i === active.index
        ? {
          ...it,
          exerciseId: alt.id,
          target: alt.unit === EXERCISE_BY_ID.get(current.exerciseId)?.unit ? it.target : alt.unit === "seconds" ? 30 : 10,
        }
        : it,
    );
    const nextWorkout = { ...active.workout, items };
    setWorkout(nextWorkout);
    setActive({ ...active, workout: nextWorkout });
    setSwapOpen(false);
  };

  const alternatives = useMemo(
    () =>
      exercise && profile
        ? alternativesFor(exercise, profile.equipment, profile.level, [
          ...(active?.workout.items.map((i) => i.exerciseId) ?? []),
        ])
        : [],
    [exercise, profile, active],
  );

  if (finished) {
    return (
      <Screen nav={false}>
        <SessionSummary
          minutes={finished.minutes}
          sets={finished.sets}
          volume={finished.volume}
          onSeeProgress={() => navigate({ to: "/progress" })}
          onGoHome={() => navigate({ to: "/" })}
        />
      </Screen>
    );
  }

  if (workoutLoading || activeLoading) {
    return (
      <Screen nav={false}>
        <div className="mt-24 h-40 animate-pulse rounded-2xl bg-surface" />
      </Screen>
    );
  }

  if (!workout) {
    return (
      <Screen nav={false}>
        <div className="mt-24 text-center">
          <p className="text-muted-foreground">No workout found</p>
          <Button className="mt-4" onClick={() => navigate({ to: "/" })}>
            Go home
          </Button>
        </div>
      </Screen>
    );
  }

  if (!active || !current || !exercise) {
    // Brief loading state while useEffect creates the active session
    return (
      <Screen nav={false}>
        <div className="mt-24 h-40 animate-pulse rounded-2xl bg-surface" />
      </Screen>
    );
  }

  const total = active.workout.items.length;
  const isTime = exercise.unit === "seconds";

  return (
    <Screen nav={false} className="pb-16">
      <div className="flex items-center justify-between">
        <p className="tabular text-xs text-muted-foreground">
          {String(active.index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")} ·{" "}
          {REGION_LABEL[exercise.region]}
        </p>
        <Button variant="ghost" onClick={() => navigate({ to: "/" })}>
          Pause
        </Button>
      </div>

      <div className="mt-3 flex gap-1">
        {active.workout.items.map((it, i) => (
          <span
            key={it.exerciseId + i}
            className={`h-0.5 flex-1 rounded-full ${i < active.index ? "bg-primary" : i === active.index ? "bg-primary/40" : "bg-surface-2"}`}
          />
        ))}
      </div>

      {rest > 0 ? (
        <RestTimer
          rest={rest}
          exerciseName={exercise.name}
          setNumber={setNumber}
          totalSets={current.sets}
          onAddTime={() => setRest((r) => r + 20)}
          onSkipRest={() => setRest(0)}
        />
      ) : (
        <ExerciseDetail
          exercise={exercise}
          setNumber={setNumber}
          totalSets={current.sets}
          target={current.target}
          isTime={isTime}
          reps={reps}
          weight={weight}
          rpe={rpe}
          onRepsChange={setReps}
          onWeightChange={setWeight}
          onRpeChange={setRpe}
          onCompleteSet={completeSet}
          onShowAlternatives={() => setSwapOpen((s) => !s)}
          showAlternatives={swapOpen}
          alternatives={alternatives}
          onSubstitute={substitute}
          onSkipExercise={() => patch({ index: active.index + 1 })}
          onFinishEarly={() => finishWorkout(active)}
          isLastExercise={active.index >= total - 1}
        />
      )}
    </Screen>
  );
}
