/**
 * Notification service for PWA push notifications
 * Handles permission requests, notification scheduling, and reminder management
 */

export interface Reminder {
  id: string;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  message: string;
}

const REMINDERS_KEY = 'cadence.reminders.v1';

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
 * Check if notifications are supported and permission is granted
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Show a local notification immediately
 */
export function showNotification(title: string, options?: NotificationOptions): void {
  if (!areNotificationsEnabled()) return;

  try {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options,
    });
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

/**
 * Get all saved reminders from localStorage
 */
export function getReminders(): Reminder[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save reminders to localStorage
 */
export function saveReminders(reminders: Reminder[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Failed to save reminders:', error);
  }
}

/**
 * Add a new reminder
 */
export function addReminder(reminder: Omit<Reminder, 'id'>): Reminder {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: crypto.randomUUID().replace("-", '').substring(0, 10),
  };
  saveReminders([...reminders, newReminder]);
  return newReminder;
}

/**
 * Update an existing reminder
 */
export function updateReminder(id: string, updates: Partial<Reminder>): void {
  const reminders = getReminders();
  const index = reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    reminders[index] = { ...reminders[index], ...updates } as typeof reminders[number];
    saveReminders(reminders);
  }
}

/**
 * Delete a reminder
 */
export function deleteReminder(id: string): void {
  const reminders = getReminders();
  saveReminders(reminders.filter(r => r.id !== id));
}

/**
 * Check if a reminder should trigger for the current day and time
 */
export function shouldTriggerReminder(reminder: Reminder): boolean {
  if (!reminder.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const [hours, minutes] = reminder.time.split(':').map(Number);
  if (!hours || !minutes) throw new Error("Invalid Time");

  const reminderTime = hours * 60 + minutes;

  // Check if it's the right day and time (within the same minute)
  return reminder.days.includes(currentDay) && currentTime === reminderTime;
}

/**
 * Initialize the reminder check interval
 * This should be called when the app loads
 */
let reminderCheckInterval: number | null = null;

export function startReminderChecks(): void {
  console.debug("[RUNNING]: reminderChecks")
  if (reminderCheckInterval !== null) return;
  const enabled = !areNotificationsEnabled()
  if (enabled) return;

  // Check every minute
  reminderCheckInterval = window.setInterval(() => {
    const reminders = getReminders();
    console.log(reminders)
    reminders.forEach(reminder => {
      const shouldTrigger = shouldTriggerReminder(reminder)
      if (shouldTrigger) {
        showNotification('Workout Reminder', {
          body: reminder.message,
          tag: reminder.id,
          requireInteraction: false,
        });
      }
    });
  }, 60000); // Check every minute
}

export function stopReminderChecks(): void {
  if (reminderCheckInterval !== null) {
    clearInterval(reminderCheckInterval);
    reminderCheckInterval = null;
  }
}

/**
 * Parse time string to hours and minutes
 */
export function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  if (!hours || !minutes) throw new Error("Invalid Time");
  return { hours, minutes };
}

/**
 * Format hours and minutes to HH:MM string
 */
export function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}