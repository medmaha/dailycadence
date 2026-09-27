/**
 * Notification service for PWA push notifications
 * Handles permission requests, notification scheduling, and reminder management
 */

import { getRingtoneById } from "./audioManager";
import type { Reminder } from "./reminders";

const REMINDERS_KEY = 'cadence.reminders.v1';

/**
 * Request notification permission from the user
*/

export function initNotificationSettings() {
  try {
    window._REMINDERS_KEY = REMINDERS_KEY
  } catch (error) {
    console.error(error)
  }
}

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
 * Check if notifications are supported and permission is granted
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show a local notification immediately
 */
export function showNotification(title: string, reminder: Reminder, options?: NotificationOptions): void {
  if (!areNotificationsEnabled()) return;

  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: reminder.id,
      body: reminder.message,
      ...options,
      data: {
        ...(options?.data || {}),
        ringtone: getRingtoneById(reminder.ringtoneId)
      }
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

