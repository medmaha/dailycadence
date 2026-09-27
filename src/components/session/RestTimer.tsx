import { Eyebrow } from "@/components/ui-kit";
import { Button } from "@/components/ui-kit";

interface RestTimerProps {
  rest: number;
  exerciseName: string;
  setNumber: number;
  totalSets: number;
  onAddTime: () => void;
  onSkipRest: () => void;
}

export function RestTimer({
  rest,
  exerciseName,
  setNumber,
  totalSets,
  onAddTime,
  onSkipRest,
}: RestTimerProps) {
  return (
    <section className="mt-12 animate-rise text-center">
      <Eyebrow>Rest</Eyebrow>
      <p className="tabular mt-4 font-display text-7xl">{rest}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Next: {exerciseName} · set {setNumber} of {totalSets}
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Button variant="outline" onClick={onAddTime}>
          +20s
        </Button>
        <Button onClick={onSkipRest}>Skip rest</Button>
      </div>
    </section>
  );
}