import { useEffect, useRef, useState } from "react";
import { getAssetUrl } from "@bryllim/workout-guide";

import { cn } from "@/lib/utils";


interface ExerciseAnimationProps {
    exerciseId: string;
    className?: string;
    showLabel?: boolean;
    singleFrame?: boolean;
}

/** Returns the animation slug for an exercise, or null if unmapped. */
export function getAnimationSlug(exerciseId: string): string {
    return exerciseId
}

/**
 * Displays animated exercise demonstration using workout-guide package
 * Shows 3 frames cycling through to create animation effect
 */
export function ExerciseAnimation({
    exerciseId,
    className = "",
    singleFrame = false,
    showLabel = true,
}: ExerciseAnimationProps) {
    const workoutGuideId = getAnimationSlug(exerciseId);
    const [currentFrame, setCurrentFrame] = useState<1 | 2 | 3>(1);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!workoutGuideId || singleFrame) return;

        // Cycle through frames 1, 2, 3
        intervalRef.current = setInterval(() => {
            setCurrentFrame((prev) => {
                const next = (prev % 3) + 1;
                return next as 1 | 2 | 3;
            });
        }, 800); // Change frame every 800ms

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [workoutGuideId]);

    if (!workoutGuideId) {
        return null;
    }

    const assetUrl = getAssetUrl(workoutGuideId, currentFrame);

    if (!assetUrl) {
        return null;
    }

    return (
        <div className={cn(`relative bg-secondary/10 rounded-xl min-h-45`, className)}>
            <img
                src={assetUrl}
                alt={`Exercise demonstration frame ${currentFrame}`}
                className="h-auto w-full object-contain"
                onError={(e) => {
                    // Fallback: hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = "none";
                }}
            />
            {/* {showLabel && (
        <p className="mt-0.5 text-center text-xs text-muted-foreground">
          Exercise demonstration
        </p>
      )} */}
        </div>
    );
}
