import { EXERCISES } from "./exercise-data";
import type { Region, Exercise, Equipment, Level } from "./types";

/**
 * A mapping from regions to their corresponding labels.
 */
export const REGION_LABEL: Record<Region, string> = {
    push: "Upper push", // Upper push exercises
    pull: "Upper pull", // Upper pull exercises
    legs: "Legs", // Leg exercises
    core: "Core", // Core exercises
    mobility: "Mobility", // Mobility exercises
    cardio: "Conditioning", // Conditioning exercises
};


/**
 * Checks if an exercise is available based on the user's equipment.
 * @param ex - The exercise to check.
 * @param equipment - The user's equipment.
 * @returns True if the exercise is available, false otherwise.
 */
export function isAvailable(ex: Exercise, equipment: Equipment[]): boolean {
    return ex.equipment === "none" || equipment.includes(ex.equipment);
}

/**
 * Converts a level string to an index.
 * @param level - The level string.
 * @returns The index corresponding to the level string.
 */
export function levelIndex(level: Level): 0 | 1 | 2 {
    return level === "new" ? 0 : level === "returning" ? 1 : 2;
}

/**
 * Retrieves alternative exercises for a given exercise, equipment, and level.
 * @param exercise - The exercise for which to find alternatives.
 * @param equipment - The user's equipment.
 * @param level - The user's level.
 * @param exclude - Exercise IDs to exclude from the alternatives.
 * @returns An array of alternative exercises.
 */
export function alternativesFor(
    exercise: Exercise,
    equipment: Equipment[],
    level: Level,
    exclude: string[] = [],
): Exercise[] {
    const li = levelIndex(level);
    // Filter exercises that meet the criteria.
    return (
        EXERCISES.filter(
            (e) =>
                e.id !== exercise.id &&
                e.region === exercise.region &&
                e.minLevel <= li &&
                isAvailable(e, equipment) &&
                !exclude.includes(e.id),
        )
            // Sort the exercises by their intensity difference with the given exercise.
            .sort(
                (a, b) =>
                    Math.abs(a.intensity - exercise.intensity) -
                    Math.abs(b.intensity - exercise.intensity),
            )
            // Select the first three exercises.
            .slice(0, 3)
    );
}
