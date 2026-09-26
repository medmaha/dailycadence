import { useEffect, useRef, useState } from "react";

interface ExerciseCountdownProps {
  target: number;
  unit: "seconds" | "reps";
  onComplete?: () => void;
}

/**
 * Countdown timer for exercises with start/pause functionality
 * For time-based exercises: counts down from target seconds
 * For rep-based exercises: acts as a pacing guide (optional)
 */
export function ExerciseCountdown({ target, unit, onComplete }: ExerciseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(target);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Reset when target changes
    setTimeLeft(target);
    setIsRunning(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [target]);

  useEffect(() => {
    if (!isRunning || isPaused || timeLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isPaused, timeLeft, onComplete]);

  const handleStart = () => {
    if (timeLeft <= 0) {
      setTimeLeft(target);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setTimeLeft(target);
    setIsRunning(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const progress = ((target - timeLeft) / target) * 100;
  const isComplete = timeLeft <= 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {unit === "seconds" ? "Timer" : "Pacing"}
        </span>
        <span className="tabular font-display text-2xl text-primary">
          {timeLeft}
          <span className="ml-1 text-sm text-muted-foreground">
            {unit === "seconds" ? "s" : ""}
          </span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3 h-2 rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {isComplete ? "Restart" : "Start"}
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={handleResume}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Resume
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}