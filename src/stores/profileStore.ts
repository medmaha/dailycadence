import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { STORAGE_KEYS } from "./keys";
import { Profile } from "@/lib/types";

type ProfileStore = {
    profile: Profile | null;
    updateProfile: (profile: Partial<Profile> | null) => void;
};

export const useProfileStore = create<ProfileStore>()(
    persist(
        (set, get) => ({
            profile: null,
            updateProfile: (profile: any) => {
                const e = get().profile;
                if (profile) {
                    const payload = {
                        ...e,
                        ...profile,
                    } satisfies Profile;
                    set({ profile: payload });
                } else {
                    set({ profile: null });
                }
            },
        }),
        {
            name: STORAGE_KEYS.PROFILE,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
