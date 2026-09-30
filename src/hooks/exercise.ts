import { useExerciseStore } from "@/stores/exerciseStore";
import { useLoading } from "./loading";

export function useTodayWorkout() {
    const isLoading = useLoading();
    const today = useExerciseStore((s) => s.today);
    const setToday = useExerciseStore((s) => s.setToday);
    return [today, setToday, isLoading] as const;
}

export function useActiveSession() {
    const isLoading = useLoading();

    const active = useExerciseStore((s) => s.active);
    const setActive = useExerciseStore((s) => s.setActive);
    return [active, setActive, isLoading] as const;
}
