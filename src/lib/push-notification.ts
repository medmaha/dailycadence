import { useRingtoneStore } from "@/stores/ringtoneStore";
import { getRingtones } from "./ringtones";
import type { Reminder } from "./reminders";
import { usePushNotificationStore } from "@/stores/notificationStore";

/**
 * Show a local notification immediately
 */
export function showNotification(
    title: string,
    reminder: Reminder,
    options?: NotificationOptions,
): void {
    if (!usePushNotificationStore.getState().isNotificationsEnabled()) return;

    try {
        // Play ringtone if sound is enabled
        if (useRingtoneStore.getState().isSoundEnabled()) {
            const ringtones = getRingtones();
            const ringtone = ringtones.find((r) => r.id === reminder.ringtoneId) || ringtones[0];
            if (ringtone) {
                const audio = new Audio(ringtone.dataUrl);
                audio.play().catch(console.error);
            }
        }
        new Notification(title, {
            icon: "/assets/push-badge.png",
            badge: "/assets/push-badge.png",
            tag: reminder.id,
            body: reminder.message,
            ...options,
        });
    } catch (error) {
        console.error("Failed to show notification:", error);
    }
}
