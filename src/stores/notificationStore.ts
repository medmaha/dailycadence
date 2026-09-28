

import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'

import { STORAGE_KEYS } from "./keys";


type NotificationStore = {
    isNotificationsEnabled: () => boolean
}

export const usePushNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            isNotificationsEnabled: () => {
                const enabled = 'Notification' in window && Notification.permission === 'granted';
                return enabled
            }
        }),
        {
            name: STORAGE_KEYS.PUSH_NOTIFICATION,
            storage: createJSONStorage(() => localStorage),
        }
    )
)