

import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'

import { Ringtone } from "@/lib/ringtones"
import { STORAGE_KEYS } from "./keys";


type RingtoneStore = {
    ringtones: Ringtone[]
    soundEnabled: boolean | null
    isSoundEnabled: () => boolean
    setRingtones: (ringtones: Ringtone[]) => void
    setSoundEnabled: (enable: boolean) => void
}


export const useRingtoneStore = create<RingtoneStore>()(
    persist(
        (set, get) => ({
            ringtones: [],
            soundEnabled: null,
            setRingtones: (ringtones) => set({ ringtones }),
            setSoundEnabled: (enable) => set({ soundEnabled: enable }),
            isSoundEnabled: () => {
                const stored = get().soundEnabled
                return stored === null ? true : stored;
            },
        }),
        {
            name: STORAGE_KEYS.RINGTONES,
            storage: createJSONStorage(() => localStorage),
        }
    )
)