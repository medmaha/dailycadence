import { useReminderStore } from "@/stores/reminderStore";
import { usePushNotificationStore } from "@/stores/notificationStore";
import { scheduleReminder } from "@/functions/onesignal";
import { useAppStore } from "@/stores/appStore";
import { getReminders, MAX_REMINDERS, Reminder } from "./reminders";
import { readEnvAndParseNumber } from "./helpers";
import { STORAGE_KEYS } from "@/stores/keys";
import indexDB from "./indexedDb";

const STORE_ID = "_queue";
const PENDING_KEY = `${STORAGE_KEYS.APP_NAME.toLowerCase()}.pendingSchedules`;
const RESCHEDULE_DAYS_OFFSET = readEnvAndParseNumber("VITE_REMINDER_RESCHEDULE_DAYS_OFFSET", 3);

let flushing = false;
const isOnline = () => typeof navigator === "undefined" || navigator.onLine;

// A failed fetch to the server fn surfaces as a TypeError ("Failed to fetch")
const isNetworkError = (e: unknown) => e instanceof TypeError;

async function loadPending(): Promise<Set<string>> {
    try {
        const results = await indexDB.getItem<{ reminders: string[] }>("_queue", PENDING_KEY);
        return new Set(results?.reminders || []);
    } catch {
        return new Set();
    }
}

async function savePending(ids: Set<string>) {
    try {
        await indexDB.putItem(STORE_ID, { id: PENDING_KEY, reminders: Array.from(ids) });
    } catch (error) {
        console.error("Could not persist pending schedules", error);
    }
}

const withQueueLock = async <T>(fn: () => Promise<T>) => {
    if ("locks" in navigator) {
        await navigator.locks.request(STORAGE_KEYS.APP_NAME + "queue", async () => await fn());
    }
    await fn();
};

async function countReminders(pending: Set<string>): Promise<number> {
    const ids = new Set(useReminderStore.getState().reminders.map((r) => r.id));
    for (const id of pending) ids.add(id);
    return ids.size;
}

async function enqueue(id: string) {
    await withQueueLock(async () => {
        const pending = await loadPending();
        if (pending.has(id)) return;
        pending.add(id);

        // over the cap: don't queue
        if ((await countReminders(pending)) > MAX_REMINDERS) return;

        await savePending(pending);
    });
}

async function dequeue(id: string) {
    await withQueueLock(async () => {
        const pending = await loadPending();
        if (pending.delete(id)) await savePending(pending);
    });
}

/** Runs every queued schedule once the device is back online. */
export async function flushPendingSchedules(): Promise<void> {
    if (flushing || !isOnline()) return;
    flushing = true;
    try {
        const pending = await loadPending();
        if (
            pending.size &&
            !confirm("There are queued reminders while offline. Do you want to sync them now?")
        )
            return;

        for (const id of pending) {
            // always use the latest version of the reminder
            const reminder = useReminderStore.getState().reminders.find((r) => r.id === id);
            if (!reminder || !reminder.enabled || reminder.storageId) {
                void dequeue(id); // deleted, disabled, or already scheduled
                continue;
            }
            try {
                await submitSchedule(reminder);
                void dequeue(id);
            } catch (error) {
                if (isNetworkError(error) || !isOnline()) break; // still offline, keep the rest queued
                console.error("Dropping queued schedule", id, error);
                void dequeue(id); // non-network failure: don't retry forever
            }
        }
    } finally {
        flushing = false;
    }
}

let reminderCheckInterval: number | null = null;
export async function startReminderChecks(): Promise<void> {
    if (reminderCheckInterval !== null) return;

    window.addEventListener("online", flushPendingSchedules);
    void flushPendingSchedules(); // send anything left over from a previous session

    let interval = 0;
    reminderCheckInterval = window.setInterval(() => {
        if (interval === 0) {
            interval++;
            return;
        }
        const enabled = usePushNotificationStore.getState().isNotificationsEnabled();
        if (!enabled) {
            stopReminderChecks();
            return;
        }
        getReminders().forEach((reminder) => {
            if (shouldTriggerReminder(reminder)) {
                void newReminderScheduler(reminder);
            }
        });
    }, 60000);
}

export function stopReminderChecks(): void {
    window.removeEventListener("online", flushPendingSchedules);
    if (reminderCheckInterval !== null) {
        clearInterval(reminderCheckInterval);
        reminderCheckInterval = null;
    }
}

const inFlight = new Set<string>();

function shouldTriggerReminder(reminder: Reminder): boolean {
    if (!reminder.enabled || reminder.days.length === 0) return false;
    if (inFlight.has(reminder.id)) return false;

    const pushes = reminder._pushMsgTimes || [];
    const lastMs = pushes.length ? Math.max(...pushes) : 0;
    const offsetMs = RESCHEDULE_DAYS_OFFSET * 24 * 60 * 60 * 1000;

    return lastMs - Date.now() <= offsetMs;
}

/** Use this at the creation point (the "add reminder" action) */
export async function canCreateReminder(): Promise<boolean> {
    const pending = await loadPending();
    return (await countReminders(pending)) < MAX_REMINDERS;
}

/** Schedules now if online, otherwise queues it for when the connection returns. */
export async function newReminderScheduler(reminder: Reminder): Promise<void> {
    if (inFlight.has(reminder.id)) return;
    inFlight.add(reminder.id);
    try {
        if (!isOnline()) return void (await enqueue(reminder.id));
        try {
            await submitSchedule(reminder);
            await dequeue(reminder.id);
        } catch (error) {
            if (isNetworkError(error) || !isOnline()) await enqueue(reminder.id);
            else console.error(error);
        }
    } finally {
        inFlight.delete(reminder.id);
    }
}

async function submitSchedule(reminder: Reminder): Promise<void> {
    const userId = useAppStore.getState().deviceId;

    const results = await scheduleReminder({
        data: { userId, reminder, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    });
    if (!results?.ids) return;

    const updated: Reminder = {
        ...reminder,
        storageId: results.ids,
        _pushMsgTimes: results.pushMsgDateMs,
    };

    const { reminders, setReminders } = useReminderStore.getState();
    setReminders(reminders.map((r) => (r.id === updated.id ? updated : r)));
}
