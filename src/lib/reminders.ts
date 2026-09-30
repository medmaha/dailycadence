import { useReminderStore } from "@/stores/reminderStore";
import { cancelNotification } from "@/functions/onesignal";
import { canCreateReminder, newReminderScheduler } from "./scheduler";
import { readEnv, readEnvAndParseNumber } from "./helpers";
import { randomUUID } from "./utils";

export interface Reminder {
    id: string;
    time: string; // HH:MM format
    days: number[]; // 0-6 (Sunday-Saturday)
    enabled: boolean;
    message: string;
    ringtoneId?: string;
    storageId?: string | null;
    _pushMsgTimes?: number[];
}

export const MAX_REMINDERS = readEnvAndParseNumber("VITE_REMINDER_MAX_ITEMS", 10);
const RESCHEDULE_PUSH_ON_CONTEXT_EDIT =
    readEnv("VITE_REMINDER_RESCHEDULE_PUSH_ON_CONTEXT_EDIT") === "true";

/**
 * Get all saved reminders
 */
export function getReminders(): Reminder[] {
    if (typeof window === "undefined") return [];
    try {
        return useReminderStore.getState().reminders;
    } catch {
        return [];
    }
}

/**
 * Add a new reminder
 */
export async function addReminder(reminder: Omit<Reminder, "id">): Promise<Reminder> {
    const reminders = getReminders();
    const canAdd = await canCreateReminder();
    if (!canAdd) {
        throw new Error(`Ops! you've reached the reminders limit`);
    }
    const newReminder: Reminder = {
        ...reminder,
        id: randomUUID(),
    };
    saveReminders([...reminders, newReminder]);
    newReminderScheduler(newReminder).catch(console.error);
    return newReminder;
}

/**
 * Update an existing reminder async
 */
export async function updateReminder(id: string, updates: Partial<Reminder>) {
    const reminders = getReminders();
    const index = reminders.findIndex((r) => r.id === id);
    if (index !== -1) {
        const prevValue = reminders[index]!;
        const updatedReminder = { ...prevValue, ...updates } as Reminder;
        reminders[index] = updatedReminder;
        saveReminders(reminders);

        const hasDateChanges = String(prevValue.days) !== String(updatedReminder.days);
        if (hasDateChanges || RESCHEDULE_PUSH_ON_CONTEXT_EDIT) {
            const storageId = updatedReminder.storageId;
            if (storageId) {
                await cancelNotification({ data: storageId });
                updatedReminder.storageId = null;
                updatedReminder._pushMsgTimes = [];
                await newReminderScheduler(updatedReminder);
            }
        }
    }
}

export async function deleteReminder(id: string) {
    const reminders = getReminders();
    const { filtered, reminder } = reminders.reduce(
        (acc, cur) => {
            if (cur.id === id) {
                acc.reminder = cur;
            } else {
                acc.filtered.push(cur);
            }
            return acc;
        },
        { filtered: [] } as { reminder?: Reminder; filtered: Reminder[] },
    );

    saveReminders(filtered);
    const storageId = reminder?.storageId;
    if (storageId) {
        await cancelNotification({ data: storageId });
    }
}

function saveReminders(reminders: Reminder[]): void {
    try {
        useReminderStore.getState().setReminders(reminders);
    } catch (error) {
        console.error("Failed to save reminders:", error);
    }
}
