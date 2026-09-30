import { useExerciseStore } from "@/stores/exerciseStore";
import { useProfileStore } from "@/stores/profileStore";
import { useLoading } from "./loading";

export function useProfile() {
    const isLoading = useLoading();
    const profile = useProfileStore((s) => s.profile);
    const updateProfile = useProfileStore((s) => s.updateProfile);
    return [profile, updateProfile, isLoading] as const;
}

export function useProfileHistory() {
    const isLoading = useLoading();
    const history = useExerciseStore((s) => s.history);

    const updateHistory = useExerciseStore((s) => s.updateHistory);
    return [history, updateHistory, isLoading] as const;
}
