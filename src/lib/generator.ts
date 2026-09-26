import type {
    Region,
    Exercise,
    Goal,
    PlannedExercise,
    Profile,
    SessionLog,
    Workout,
} from "./types";
import { isAvailable, levelIndex } from "./exercises";
import { daysBetween, todayKey } from "./store";
import { EXERCISES } from "./exercise-data";

const GOAL_SLOTS: Record<Goal, Region[]> = {
    strength: ["push", "pull", "legs", "core", "push", "legs", "pull", "core"],
    mobility: ["mobility", "core", "mobility", "legs", "mobility", "pull", "core", "mobility"],
    endurance: ["cardio", "legs", "core", "cardio", "push", "cardio", "pull", "core"],
    general: ["legs", "push", "pull", "core", "mobility", "cardio", "legs", "push"],
};

/**
 * Generate a workout based on the given profile and session history.
 * @param profile - The user's profile.
 * @param history - The user's session history.
 * @returns The generated workout.
 */
export function generateWorkout(profile: Profile, history: SessionLog[]): Workout {
    const date = todayKey();
    const rand = pseudoRandom(date + profile.goal + profile.level + profile.equipment.join(""));

    const recovery = needsRecovery(history);

    // Determine the number of exercises to be included in the workout.
    const numOfExercises = Math.min(8, Math.max(3, Math.round(profile.minutes / 6)));

    let slots: Region[];
    if (recovery) {
        // If a recovery workout is needed, include mobility exercises.
        slots = (
            ["mobility", "mobility", "core", "mobility", "legs", "mobility"] as Region[]
        ).slice(0, Math.max(3, numOfExercises - 1));
    } else {
        // Include exercises based on the user's goal and level.
        const ordered = [...new Set(GOAL_SLOTS[profile.goal])].sort(
            (a, b) => daysSinceRegion(history, b) - daysSinceRegion(history, a),
        );
        slots = [];
        let i = 0;
        while (slots.length < numOfExercises) {
            const ex = ordered[i % ordered.length];
            if (ex) {
                slots.push(ex);
            }
            i++;
        }
    }

    // Always finish with a restorative exercise on longer sessions.
    if (numOfExercises >= 5 && slots[slots.length - 2] !== "mobility") {
        slots[slots.length - 1] = "mobility";
    }

    // Generate the list of exercises to be included in the workout.
    const used = new Set<string>();
    const items: PlannedExercise[] = [];
    const chosen: Exercise[] = [];
    for (const region of slots) {
        // Find an exercise for the current region.
        const ex =
            pick(region, profile, history, used, rand, recovery ? { maxIntensity: 1 } : {}) ??
            pick("mobility", profile, history, used, rand, { maxIntensity: 2 });

        if (!ex) continue;
        used.add(ex.id);
        chosen.push(ex);

        // Generate a prescription for the exercise.
        const p = prescription(ex, profile);
        items.push(recovery ? { ...p, sets: 2, rest: 20 } : p);
    }

    // Calculate the estimated minutes for the workout based on the prescriptions.
    const intensity = chosen.reduce((sum, e) => sum + e.intensity, 0) / Math.max(1, chosen.length);
    const regions = [...new Set(chosen.map((e) => e.region))];
    const estimatedMinutes = Math.max(
        8,
        Math.round(
            items.reduce((m, it) => {
                const ex = chosen.find((c) => c.id === it.exerciseId)!;
                const work = ex.unit === "seconds" ? it.target : it.target * 3;
                return m + (it.sets * (work + it.rest)) / 60;
            }, 2),
        ),
    );

    // Return the generated workout.
    return {
        id: `${date}-${Math.floor(rand() * 1e6)}`,
        date,
        title: recovery ? "Recovery flow" : titleFor(regions, profile.goal),
        kind: recovery ? "recovery" : "training",
        regions,
        estimatedMinutes,
        intensity: Math.round(intensity * 10) / 10,
        items,
    };
}

/**
 * Simple deterministic PRNG (Pseudorandom Number Generator)
 * so a day's workout is stable once generated.
 */
function pseudoRandom(seed: string) {
    let h = 2166136261;
    // Initialize the PRNG with a seed
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    // Return a function that generates a random number
    return () => {
        // Produce the next random number
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);

        // Return a converted number between 0 and 1
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
}

/**
 * Checks if a recovery workout is needed based on the user's session history.
 * @param history - The user's session history.
 * @returns True if a recovery workout is needed, false otherwise.
 */
function needsRecovery(history: SessionLog[]) {
    // Filter the history to only include sessions that are within the last 3 days
    const today = todayKey();
    const recent = history.filter((s) => {
        const d = daysBetween(s.date, today);
        return d >= 0 && d <= 2;
    });

    // Filter the recent sessions to only include training sessions that are hard (intensity >= 2.2)
    const hard = recent.filter((s) => s.kind === "training" && s.intensity >= 2.2);

    // Create a set of unique session dates from the hard sessions
    const uniqueDays = new Set(hard.map((h) => h.date));

    // Return true if there are at least 2 unique days in the set,
    // indicating that both yesterday and today were hard training sessions
    return uniqueDays.size >= 2;
}

/**
 * Returns the number of days since the most recent session with the given region.
 * @param history - The user's session history.
 * @param region - The region to check.
 * @returns The number of days.
 */
function daysSinceRegion(history: SessionLog[], region: Region) {
    const today = todayKey();
    let best = 99;
    for (const s of history) {
        if (s.regions.includes(region)) {
            best = Math.min(best, daysBetween(s.date, today));
        }
    }
    return best;
}

/**
 * Generates a prescription for an exercise based on the user's profile.
 * @param ex - The exercise to generate a prescription for.
 * @param profile - The user's profile.
 * @returns The generated prescription.
 */
function prescription(ex: Exercise, profile: Profile): PlannedExercise {
    const li = levelIndex(profile.level);
    const isTime = ex.unit === "seconds";
    const base = isTime ? 30 : 10;

    // Calculate the goal modifier based on the user's goal
    const goalMod =
        profile.goal === "endurance"
            ? isTime
                ? 15 // Higher target for endurance sessions in seconds
                : 4 // Higher target for endurance sessions in reps
            : profile.goal === "strength"
              ? isTime
                  ? 0 // No change for strength sessions in seconds
                  : 2 // Higher target for strength sessions in reps
              : 0; // No change for general and mobility sessions

    // Calculate the level modifier based on the user's level
    const levelMod = isTime ? li * 8 : li * 3;

    // Calculate the ease modifier based on the intensity of the exercise
    const easeMod =
        ex.intensity === 3
            ? isTime
                ? -8
                : -3 // Higher rest time for very easy exercises
            : ex.intensity === 1
              ? isTime
                  ? 8
                  : 3 // Lower rest time for very hard exercises
              : 0; // No change for moderate exercises

    // Calculate the number of sets for the exercise
    const sets =
        profile.goal === "strength"
            ? li >= 1
                ? 4
                : 3 // 4 sets for strength sessions above beginner
            : ex.region === "mobility"
              ? 2
              : 3; // 2 sets for mobility exercises

    // Calculate the rest time for the exercise
    const rest =
        ex.region === "mobility"
            ? 20 // 20 seconds rest time for mobility exercises
            : profile.goal === "strength"
              ? 75
              : 45; // 75 seconds rest time for strength sessions

    return {
        exerciseId: ex.id,
        sets,
        target: Math.max(isTime ? 20 : 5, base + goalMod + levelMod + easeMod),
        rest,
    };
}

/**
 * Picks an exercise from a pool of candidates based on the user's profile and session history.
 * @param region - The region of exercises to pick from.
 * @param profile - The user's profile.
 * @param history - The user's session history.
 * @param used - A set of exercise IDs that have already been used.
 * @param rand - A PRNG function.
 * @param opts - Additional options.
 * @returns The picked exercise, or null if no suitable exercise is found.
 */
function pick(
    region: Region,
    profile: Profile,
    history: SessionLog[],
    used: Set<string>,
    rand: () => number,
    opts: { maxIntensity?: number } = {},
) {
    // Filter exercises based on profile level, region, availability, and not yet used
    const li = levelIndex(profile.level);
    const lastIds = new Set(history[0]?.entries.map((e) => e.exerciseId) ?? []);
    const pool = EXERCISES.filter(
        (e) =>
            e.region === region &&
            e.minLevel <= li &&
            isAvailable(e, profile.equipment) &&
            !used.has(e.id) &&
            (opts.maxIntensity ? e.intensity <= opts.maxIntensity : true),
    );
    if (pool.length === 0) return null;

    // If there are exercises not done in the last session, prioritize them
    const fresh = pool.filter((e) => !lastIds.has(e.id));

    // If there are no fresh exercises, all exercises are candidates
    const candidates = fresh.length > 0 ? fresh : pool;

    // Pick a random exercise from the candidates
    return candidates[Math.floor(rand() * candidates.length)];
}

/**
 * Generates a title for a workout based on the regions and goal.
 * @param regions - The regions covered by the workout.
 * @param goal - The user's goal.
 * @returns The generated title.
 */
function titleFor(regions: Region[], goal: Goal) {
    // Get the primary region.
    const primary = regions[0];

    // Define a mapping from regions to their corresponding titles.
    const map: Record<Region, string> = {
        push: "Upper body push",
        pull: "Upper body pull",
        legs: "Lower body",
        core: "Midline",
        mobility: "Mobility flow",
        cardio: "Conditioning",
    };

    // Determine the suffix based on the user's goal.
    const suffix =
        goal === "strength"
            ? "strength"
            : goal === "endurance"
              ? "circuit"
              : goal === "mobility"
                ? "flow"
                : "session";

    // Return the generated title.
    if (regions.length >= 3) {
        // Return "Full body circuit" or "Full body session" for full body workouts.
        return `Full body ${suffix}`;
    }
    // Return the title for the primary region or "Full body"
    // for workouts with no primary region.
    return `${primary ? map[primary] : "Full body"} ${suffix}`;
}
