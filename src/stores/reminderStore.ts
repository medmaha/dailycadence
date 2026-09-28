

import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'

import { Reminder } from "@/lib/reminders"
import { STORAGE_KEYS } from "./keys"


type ReminderStore = {
    reminders: Reminder[]
    setReminders: (Reminders: Reminder[]) => void
}


export const useReminderStore = create<ReminderStore>()(
    persist(
        (set, get) => ({
            reminders: [],
            setReminders: (reminders) => set({ reminders }),
        }),
        {
            name: STORAGE_KEYS.REMINDERS,
            storage: createJSONStorage(() => localStorage),
        }
    )
)