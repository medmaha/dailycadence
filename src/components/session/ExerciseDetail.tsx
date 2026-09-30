import { Eyebrow } from "@/components/ui-kit";
import { ExerciseAnimation } from "@/components/ExerciseAnimation";
import { ExerciseCountdown } from "@/components/ExerciseCountdown";
import { LogField } from "./LogField";
import { Button } from "@/components/ui-kit";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Exercise, SetLog } from "@/lib/types";

interface ExerciseDetailProps {
    exercise: Exercise;
    setNumber: number;
    totalSets: number;
    target: number;
    isTime: boolean;
    reps: string;
    weight: string;
    rpe: string;
    onRepsChange: (value: string) => void;
    onWeightChange: (value: string) => void;
    onRpeChange: (value: string) => void;
    onCompleteSet: () => void;
    onShowAlternatives: () => void;
    showAlternatives: boolean;
    alternatives: Exercise[];
    onSubstitute: (alt: Exercise) => void;
    onSkipExercise: () => void;
    onFinishEarly: () => void;
    isLastExercise: boolean;
}

export function ExerciseDetail({
    exercise,
    setNumber,
    totalSets,
    target,
    isTime,
    reps,
    weight,
    rpe,
    onRepsChange,
    onWeightChange,
    onRpeChange,
    onCompleteSet,
    onShowAlternatives,
    showAlternatives,
    alternatives,
    onSubstitute,
    onSkipExercise,
    onFinishEarly,
    isLastExercise,
}: ExerciseDetailProps) {
    return (
        <TooltipProvider>
            <section className="mt-6 sm:mt-10 animate-rise" key={exercise.id + setNumber}>
                <Eyebrow>
                    Set {setNumber} of {totalSets}
                </Eyebrow>
                <h1 className="sm:mt-3 mt-2 text-3xl sm:text-4xl font-semibold leading-tight">
                    {exercise.name}
                </h1>
                <p className="tabular sm:mt-2 font-display text-xl sm:text-2xl text-primary">
                    {target}
                    {isTime ? " seconds" : " reps"}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">{exercise.cue}</p>

                <div className="mt-2">
                    <ExerciseAnimation exerciseId={exercise.imageName} className="mx-auto max-w-50" />
                </div>

                <div className="mt-4">
                    <ExerciseCountdown
                        target={target}
                        unit={exercise.unit}
                        onComplete={() => {
                            // Optional: auto-advance or notification when timer completes
                        }}
                    >
                        <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-3">
                            <LogField
                                label={isTime ? "Seconds" : "Reps"}
                                value={reps}
                                onChange={onRepsChange}
                                hintText={
                                    isTime
                                        ? "How many seconds you did the exercise"
                                        : "How many repetitions you did"
                                }
                                placeholder={String(target)}
                            />
                            <LogField
                                label="Weight"
                                value={weight}
                                onChange={onWeightChange}
                                hintText="How much weight you used"
                                placeholder="—"
                            />
                            <LogField
                                label="Rating Assertion"
                                value={rpe}
                                onChange={onRpeChange}
                                hintText="How hard the exercise was (1-10, 1 being easy)"
                                placeholder="1-10"
                            />
                        </div>

                        <Button className="mt-4 w-full" onClick={onCompleteSet}>
                            {setNumber >= totalSets && isLastExercise
                                ? "Finish session"
                                : "Complete set"}
                        </Button>
                    </ExerciseCountdown>
                </div>

                <Button
                    variant="outline"
                    onClick={onShowAlternatives}
                    className="ring-focus mt-4 w-full rounded-xl border border-border px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    Can't do this one - show alternatives
                </Button>

                {showAlternatives ? (
                    <div className="mt-3 animate-rise space-y-2">
                        {alternatives.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No close match with your equipment. Skip it and keep moving.
                            </p>
                        ) : (
                            alternatives.map((alt) => (
                                <button
                                    key={alt.id}
                                    onClick={() => {
                                        if (confirm(`Switch exercise to ${alt.name}`)) {
                                            onSubstitute(alt);
                                        }
                                    }}
                                    className="ring-focus block w-full rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong active:animate-pop"
                                >
                                    <div className="flex items-start gap-2 h-max">
                                        <div className="h-max">
                                            <ExerciseAnimation
                                                exerciseId={alt.imageName}
                                                className="w-16 h-18! min-h-18"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-display">{alt.name}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-3">
                                                {alt.cue}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                ) : null}

                {!isLastExercise ? (
                    <button
                        onClick={onSkipExercise}
                        className="ring-focus mt-4 sm:mt-6 w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                        Skip exercise
                    </button>
                ) : (
                    <button
                        onClick={onFinishEarly}
                        className="ring-focus mt-4 sm:mt-6 w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                        End session early
                    </button>
                )}
            </section>
        </TooltipProvider>
    );
}
