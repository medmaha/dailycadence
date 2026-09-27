import { Card, Eyebrow } from "@/components/ui-kit";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui-kit";
import { EXERCISE_BY_ID, REGION_LABEL } from "@/lib/exercises";
import type { Workout } from "@/lib/types";

interface WorkoutCardProps {
  workout: Workout;
  hasActiveSession: boolean;
  onRebuild: () => void;
  historyCount: number;
}

export function WorkoutCard({
  workout,
  hasActiveSession,
  onRebuild,
  historyCount,
}: WorkoutCardProps) {
  return (
    <>
      {workout.kind === "recovery" && (
        <p className="mt-6 rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-muted-foreground animate-rise">
          You've had two demanding days close together, so today is deliberately light - mobility and
          blood flow instead of load.
        </p>
      )}

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
            {hasActiveSession ? "Resume session" : "Start"}
          </Button>
        </Link>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Built from your last {Math.min(7, historyCount)} sessions
        </p>
        <Button variant="ghost" onClick={onRebuild}>
          Rebuild
        </Button>
      </div>
    </>
  );
}