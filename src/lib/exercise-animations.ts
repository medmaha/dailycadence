/**
 * Mapping between custom exercise IDs and workout-guide exercise IDs
 * for animated exercise demonstrations
 */

export const EXERCISE_ANIMATION_MAP: Record<string, string> = {
  // push exercises
  "pushup": "push-up",
  "incline-pushup": "incline-push-up",
  "tempo-pushup": "push-up", // fallback to standard push-up
  "pike-pushup": "pike-push-up",
  "dips-chair": "bench-dip",
  "db-press": "dumbbell-floor-press",
  "db-overhead": "dumbbell-overhead-press",
  "band-press": "band-chest-press",

  // pull exercises
  "band-row": "band-row",
  "band-pulldown": "band-pulldown",
  "db-row": "dumbbell-row",
  "db-pullover": "dumbbell-pullover",
  "pullup": "pull-up",
  "chinup-negative": "chin-up-negative",
  "bar-hang": "dead-hang",
  "table-row": "inverted-row",
  "prone-swimmer": "prone-swimmer",

  // legs exercises
  "squat": "bodyweight-squat",
  "split-squat": "split-squat",
  "reverse-lunge": "reverse-lunge",
  "glute-bridge": "glute-bridge",
  "single-leg-rdl": "single-leg-romanian-deadlift",
  "wall-sit": "wall-sit",
  "calf-raise": "calf-raise",
  "db-goblet-squat": "goblet-squat",
  "db-rdl": "romanian-deadlift",
  "band-abduction": "lateral-band-walk",

  // core exercises
  "plank": "front-plank",
  "side-plank": "side-plank",
  "deadbug": "dead-bug",
  "hollow-hold": "hollow-body-hold",
  "leg-raise": "leg-raise",
  "bird-dog": "bird-dog",
  "hanging-knee-raise": "hanging-knee-raise",
  "db-suitcase-hold": "suitcase-carry",

  // mobility exercises
  "worlds-greatest": "worlds-greatest-stretch",
  "cat-cow": "cat-cow",
  "hip-90-90": "90-90-hip-switch",
  "thoracic-rotation": "thoracic-rotation",
  "couch-stretch": "couch-stretch",
  "deep-squat-hold": "deep-squat-hold",
  "shoulder-dislocate": "band-shoulder-dislocate",
  "ankle-rock": "ankle-rock-back",

  // cardio exercises
  "jump-rope": "jump-rope",
  "mountain-climber": "mountain-climber",
  "step-up": "step-up",
  "burpee": "burpee",
  "shadow-box": "shadow-boxing",
  "squat-jump": "squat-jump",
};

/**
 * Get workout-guide exercise ID for a custom exercise
 */
export function getWorkoutGuideId(customExerciseId: string): string | null {
  return EXERCISE_ANIMATION_MAP[customExerciseId] || null;
}