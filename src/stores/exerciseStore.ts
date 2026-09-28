

import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'

import { STORAGE_KEYS } from "./keys"
import { ActiveSession, SessionLog, Workout } from "@/lib/types"


type ExerciseStore = {
    active: null | ActiveSession
    setActive: (active: null | ActiveSession) => void
    today: null | Workout
    setToday: (today: null | Workout) => void
    history: SessionLog[]
    updateHistory: (history: SessionLog | null) => void
}

export const useExerciseStore = create<ExerciseStore>()(
    persist(
        (set, get) => ({
            history: [],
            updateHistory: (log) => {
                if (!log) {
                    set({ history: [] })
                    return
                }
                const curr = get().history
                const filtered = curr.filter(s => s.id !== log.id)
                set({ history: [log, ...filtered].slice(0, 400) })
            },
            active: null,
            setActive: (active) => set({ active }),
            today: null,
            setToday: (today) => set({ today })
        }),
        {
            name: STORAGE_KEYS.EXERCISES,
            storage: createJSONStorage(() => localStorage),
        }
    )
)