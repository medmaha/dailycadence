import { useRingtoneStore } from "@/stores/ringtoneStore";
import { getRingtones } from "./ringtones";
import type { Reminder } from "./reminders";
import { usePushNotificationStore } from "@/stores/notificationStore";


export function initNotificationSettings() {
  try {
  } catch (error) {
    console.error(error)
  }
}

/**
 * Request notification permission from the user
*/
export async function requestNotificationPermission(): Promise<boolean> {

  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}


/**
 * Show a local notification immediately
 */
export function showNotification(title: string, reminder: Reminder, options?: NotificationOptions): void {
  if (!usePushNotificationStore.getState().isNotificationsEnabled()) return;

  try {
    // Play ringtone if sound is enabled
    if (useRingtoneStore.getState().isSoundEnabled()) {
      const ringtones = getRingtones();
      const ringtone = ringtones.find(r => r.id === reminder.ringtoneId) || ringtones[0];
      if (ringtone) {
        const audio = new Audio(ringtone.dataUrl);
        audio.play().catch(console.error);
      }
    }

    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: reminder.id,
      body: reminder.message,
      ...options,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

