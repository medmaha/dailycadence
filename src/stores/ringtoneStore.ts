import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Ringtone } from "@/lib/ringtones";
import { STORAGE_KEYS } from "./keys";
import indexDB from "@/lib/indexedDb";
import { createIdbStorage } from "./idbStorage";

type RingtoneState = {
    ringtones: Ringtone[];
    soundEnabled: boolean | null;
    hydrated: boolean; // false until IndexedDB has answered
};

type RingtoneActions = {
    isSoundEnabled: () => boolean;
    setRingtones: (ringtones: Ringtone[]) => void;
    setSoundEnabled: (enable: boolean) => Promise<void>;
    setHydrated: (hydrated: boolean) => void;
};

export const useRingtoneStore = create<RingtoneState & RingtoneActions>()(
    persist(
        (set, get) => ({
            ringtones: [],
            soundEnabled: null,
            hydrated: false,

            setRingtones: (ringtones) => set({ ringtones }),
            setHydrated: (hydrated) => set({ hydrated }),
            isSoundEnabled: () => get().soundEnabled ?? true,

            setSoundEnabled: async (enable) => {
                set({ soundEnabled: enable });
                try {
                    // the service worker reads this record
                    await indexDB.putItem("kv", { id: "soundSetting", enabled: enable });
                } catch (error) {
                    console.error("Failed to sync sound setting", error);
                }
            },
        }),
        {
            name: STORAGE_KEYS.RINGTONES, // record id inside the "kv" store
            storage: createIdbStorage<Pick<RingtoneState, "ringtones" | "soundEnabled">>(),
            partialize: (state) => ({
                ringtones: state.ringtones,
                soundEnabled: state.soundEnabled,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
                // make sure the worker has a record even if the user never toggled
                if (state) {
                    void indexDB
                        .putItem("kv", { id: "soundSetting", enabled: state.isSoundEnabled() })
                        .catch(console.error);
                }
            },
        },
    ),
);
