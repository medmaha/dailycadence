import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { InfoIcon } from "lucide-react"

import { Button, Eyebrow, Screen } from "@/components/ui-kit";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { ExerciseCountdown } from "@/components/ExerciseCountdown";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
import type { Exercise, ActiveSession, SetLog } from "@/lib/types";

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
        <div className="animate-rise pt-16">
          <Eyebrow>Session complete</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold">That's logged.</h1>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6">
            <div>
              <p className="tabular font-display text-3xl">{finished.minutes}</p>
              <p className="mt-1 text-xs text-muted-foreground">minutes</p>
            </div>
            <div>
              <p className="tabular font-display text-3xl">{finished.sets}</p>
              <p className="mt-1 text-xs text-muted-foreground">sets</p>
            </div>
            <div>
              <p className="tabular font-display text-3xl">{finished.volume}</p>
              <p className="mt-1 text-xs text-muted-foreground">volume</p>
            </div>
          </div>
          <div className="mt-10 flex gap-3">
            <Button size="lg" className="flex-1" onClick={() => navigate({ to: "/progress" })}>
              See progress
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate({ to: "/" })}>
              Home
            </Button>
          </div>
        </div>
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

      <TooltipProvider>

        {rest > 0 ? (
          <section className="mt-12 animate-rise text-center">
            <Eyebrow>Rest</Eyebrow>
            <p className="tabular mt-4 font-display text-7xl">{rest}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Next: {exercise.name} · set {setNumber} of {current.sets}
            </p>
            <div className="mt-10 flex justify-center gap-3">
              <Button variant="outline" onClick={() => setRest((r) => r + 20)}>
                +20s
              </Button>
              <Button onClick={() => setRest(0)}>Skip rest</Button>
            </div>
          </section>
        ) : (
          <section className="mt-6 sm:mt-10 animate-rise" key={exercise.id + setNumber}>
            <Eyebrow>
              Set {setNumber} of {current.sets}
            </Eyebrow>
            <h1 className="sm:mt-3 mt-2 text-3xl sm:text-4xl font-semibold leading-tight">{exercise.name}</h1>
            <p className="tabular sm:mt-2 font-display text-xl sm:text-2xl text-primary">
              {current.target}
              {isTime ? " seconds" : " reps"}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{exercise.cue}</p>

            <div className="mt-2">
              <ExerciseAnimation exerciseId={exercise.id} className="mx-auto max-w-50" />
            </div>

            <div className="mt-4">
              <ExerciseCountdown
                target={current.target}
                unit={exercise.unit}
                onComplete={() => {
                  // Optional: auto-advance or notification when timer completes
                }}
              />
            </div>

            <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-3">
              <LogField
                label={isTime ? "Seconds" : "Reps"}
                value={reps}
                onChange={setReps}
                hintText={isTime ? "How many seconds you did the exercise" : "How many repetitions you did"}
                placeholder={String(current.target)}
              />
              <LogField
                label="Weight"
                value={weight}
                onChange={setWeight}
                hintText="How much weight you used"
                placeholder="—"
              />
              <LogField
                label="RPE"
                value={rpe}
                onChange={setRpe}
                hintText="How hard the exercise was (1–10, 1 being easy)"
                placeholder="1–10"
              />
            </div>

            <Button className="mt-4 w-full" onClick={completeSet}>
              {setNumber >= current.sets && active.index >= total - 1 ? "Finish session" : "Complete set"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setSwapOpen((s) => !s)}
              className="ring-focus mt-4 w-full rounded-xl border border-border px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Can't do this one - show alternatives
            </Button>

            {swapOpen ? (
              <div className="mt-3 animate-rise space-y-2">
                {alternatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No close match with your equipment. Skip it and keep moving.
                  </p>
                ) : (
                  alternatives.map((alt) => (
                    <button
                      key={alt.id}
                      onClick={() => substitute(alt)}
                      className="ring-focus w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong active:animate-pop"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          <ExerciseAnimation exerciseId={alt.id} className="w-16" showLabel={false} />
                        </div>
                        <div className="flex-1">
                          <p className="font-display">{alt.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{alt.cue}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {active.index < total - 1 ? (
              <button
                onClick={() => patch({ index: active.index + 1 })}
                className="ring-focus mt-4 sm:mt-6 w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Skip exercise
              </button>
            ) : (
              <button
                onClick={() => finishWorkout(active)}
                className="ring-focus mt-4 sm:mt-6 w-full text-xs text-muted-foreground hover:text-foreground"
              >
                End session early
              </button>
            )}
          </section>
        )}
      </TooltipProvider>
    </Screen>
  );
}

function LogField({
  label,
  value,
  onChange,
  hintText,
  placeholder,
}: {
  label: string;
  value: string;
  hintText: string
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1">
        <span className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground pl-1">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="w-3 h-3" />
          </TooltipTrigger>
          <TooltipContent className="bg-secondary text-secondary-foreground border border-secondary-foreground/60 shadow-2xl py-4 px-3">
            {hintText}
          </TooltipContent>
        </Tooltip>
      </div>
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        className="tabular ring-focus mt-1 sm:mt-1.5 w-full rounded-xl border border-input bg-surface p-2 font-display text-lg sm:text-xl sm:p-3 outline-none placeholder:text-muted-foreground/60"
      />
    </label>
  );
}
