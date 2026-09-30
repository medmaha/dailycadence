import { create } from "zustand";

type NotificationStore = {
    permission: NotificationPermission | "unsupported";
    refresh: () => void;
    isNotificationsEnabled: () => boolean;
};

const readPermission = (): NotificationStore["permission"] =>
    typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "unsupported";

export const usePushNotificationStore = create<NotificationStore>()((set, get) => ({
    permission: "default",
    refresh: () => set({ permission: readPermission() }),
    isNotificationsEnabled: () =>
        get().permission === "granted" &&
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        !!navigator.serviceWorker.controller,
}));
