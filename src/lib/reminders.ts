import { STORAGE_KEYS } from "@/stores/keys";
import { showNotification } from "./push-notification";
import { useReminderStore } from "@/stores/reminderStore";
import { usePushNotificationStore } from "@/stores/notificationStore";

export interface Reminder {
  id: string;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
  message: string;
  ringtoneId?: string
}

export function initReminderSettings() {
  try {
    window._REMINDERS_KEY = STORAGE_KEYS.REMINDERS
  } catch (error) {
    console.error(error)
  }
}

/**
 * Get all saved reminders
 */
export function getReminders(): Reminder[] {
  if (typeof window === 'undefined') return [];
  try {
    return useReminderStore.getState().reminders
  } catch {
    return [];
  }
}

/**
 * Add a new reminder
 */
export function addReminder(reminder: Omit<Reminder, 'id'>): Reminder {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: crypto.randomUUID().replace(/-/gi, '').substring(0, 10).toUpperCase(),
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

export function deleteReminder(id: string): void {
  const reminders = getReminders();
  saveReminders(reminders.filter(r => r.id !== id));
}


function saveReminders(reminders: Reminder[]): void {
  try {
    useReminderStore.getState().setReminders(reminders)
  } catch (error) {
    console.error('Failed to save reminders:', error);
  }
}

let reminderCheckInterval: number | null = null;

/**
 * Initialize the reminder check interval
 * This should be called when the app loads
 */
export function startReminderChecks(): void {
  if (reminderCheckInterval !== null) return;
  const enabled = usePushNotificationStore.getState().isNotificationsEnabled()
  if (!enabled) return;

  // Check every minute
  reminderCheckInterval = window.setInterval(() => {
    const reminders = getReminders();
    reminders.forEach(reminder => {
      const shouldTrigger = shouldTriggerReminder(reminder)
      if (shouldTrigger) {
        showNotification('Workout Reminder', reminder, {
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
 * Check if a reminder should trigger for the current day and time
 */
function shouldTriggerReminder(reminder: Reminder): boolean {
  if (!reminder.enabled) return false;

  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const { hours, minutes } = parseTime(reminder.time);
  if (!hours || !minutes) throw new Error("Invalid Time");

  const reminderTime = hours * 60 + minutes;

  // Check if it's the right day and time (within the same minute)
  return reminder.days.includes(currentDay) && currentTime === reminderTime;
}


/**
 * Parse time string to hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number);
  if (hours === undefined || minutes === undefined) throw new Error("Invalid Time: " + time);
  return { hours, minutes };
}