export type Equipment = "none" | "bands" | "dumbbells" | "pullupbar";
export type Region = "push" | "pull" | "legs" | "core" | "mobility" | "cardio";
export type Level = "new" | "returning" | "trained";

export type Exercise = {
    id: string;
    name: string;
    region: Region;
    /** Needs at least one of these available. "none" means bodyweight only. */
    equipment: Equipment;
    /** 1 = easy / recovery, 2 = moderate, 3 = demanding */
    intensity: 1 | 2 | 3;
    minLevel: 0 | 1 | 2;
    unit: "reps" | "seconds";
    cue: string;
};

//
export type Goal = "strength" | "mobility" | "endurance" | "general";

export type Profile = {
    name?: string;
    goal: Goal;
    equipment: Equipment[];
    minutes: number;
    level: Level;
    createdAt: string;
};

export type SetLog = {
    reps?: number | undefined;
    weight?: number | undefined;
    rpe?: number | undefined;
    done: boolean;
};

export type PlannedExercise = {
    exerciseId: string;
    sets: number;
    target: number; // reps or seconds
    rest: number; // seconds
};

export type Workout = {
    id: string;
    date: string; // yyyy-mm-dd
    title: string;
    kind: "training" | "recovery";
    regions: Region[];
    estimatedMinutes: number;
    intensity: number; // 1..3 average
    items: PlannedExercise[];
};

export type SessionLog = {
    id: string;
    date: string;
    title: string;
    kind: Workout["kind"];
    regions: Region[];
    intensity: number;
    minutes: number;
    volume: number;
    completedSets: number;
    entries: { exerciseId: string; sets: SetLog[] }[];
};

export type ActiveSession = {
    workout: Workout;
    startedAt: number;
    index: number;
    logs: Record<string, SetLog[]>;
};
