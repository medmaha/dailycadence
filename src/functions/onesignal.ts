import { createServerFn } from "@tanstack/react-start";
import { generateUUIDFromString } from "@/lib/utils.server";
import { readEnv, readEnvAndParseNumber } from "@/lib/helpers";

const API_URL = "https://api.onesignal.com";

const APP_ID = readEnv("ONESIGNAL_APP_ID");
const REST_API_KEY = readEnv("ONESIGNAL_REST_API_KEY");

const MAX_WINDOW_DAYS = readEnvAndParseNumber("ONESIGNAL_SCHEDULER_MAX_WINDOW_DAYS", 7);
const MAX_REMINDER_TO_SCHEDULE = readEnvAndParseNumber("ONESIGNAL_MAX_REMINDER_TO_SCHEDULE", 5);

const isValidTimeZone = (tz: string) => {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    } catch {
        return false;
    }
};

interface Reminder {
    time: string;
    message: string;
    days: number[];
    storageId?: string | null;
    ringtoneId?: string | null;
    _pushMsgTimes?: number[] | null;
}

interface ScheduleInput {
    userId: string;
    timezone: string;
    reminder: Reminder;
}

function _validateScheduleInput(data: ScheduleInput): ScheduleInput {
    if (typeof data !== "object" || data === null) {
        throw new Error("Invalid input: expected object");
    }
    if (!isValidTimeZone(data.timezone)) {
        throw new Error(`Invalid timezone - ${data.timezone}`);
    }
    return {
        userId: data["userId"] as string,
        timezone: data["timezone"] as string,
        reminder: {
            days: data["reminder"]["days"],
            time: data["reminder"]["time"],
            message: data["reminder"]["message"],
            storageId: data["reminder"]["storageId"] || null,
            ringtoneId: data["reminder"]["ringtoneId"] || null,
            _pushMsgTimes: data["reminder"]["_pushMsgTimes"] || null,
        },
    };
}

export const scheduleReminder = createServerFn()
    .validator(_validateScheduleInput)
    .handler(async ({ data }) => {
        const { userId, timezone, reminder } = data;
        if (reminder.storageId) return null; // already scheduled

        // Get timestamp of the last notification already scheduled
        const minDateMs = !!reminder._pushMsgTimes?.length
            ? Math.max(...reminder._pushMsgTimes)
            : null;

        const times = getSendTimes(reminder.days, reminder.time, timezone, minDateMs);
        if (times.length === 0) return null;

        const ids: string[] = [];
        const pushMsgDateMs: number[] = [];
        for (const sendAt of times) {
            try {
                const id = await runPush({
                    userId,
                    sendAt,
                    title: "Workout Reminder",
                    body: reminder.message,
                    ringtoneId: reminder.ringtoneId || "",
                });
                ids.push(id);
                pushMsgDateMs.push(sendAt.getTime());
            } catch (error) {
                console.error(error);
            }
        }
        return { ids: ids.length ? ids.join(",") : null, pushMsgDateMs };
    });

export const cancelNotification = createServerFn()
    .validator((data: unknown) => {
        if (typeof data !== "string") {
            throw new Error("Invalid input: expected string");
        }
        return data;
    })
    .handler(async ({ data }: { data: string }) => {
        const results = await Promise.all(
            data
                .split(",")
                .filter(Boolean)
                .map(async (id) => {
                    try {
                        const res = await fetch(`${API_URL}/notifications/${id}?app_id=${APP_ID}`, {
                            method: "DELETE",
                            headers: _getHeaders(),
                        });
                        return res.ok;
                    } catch {
                        return false;
                    }
                }),
        );
        return results.every(Boolean);
    });

// Used in cron jobs
export async function sendSlot(slot: string, idempotencyKey: string) {
    const body = JSON.stringify({
        app_id: APP_ID,
        target_channel: "push",
        idempotency_key: idempotencyKey, // makes cron retries safe
        filters: [
            { field: "tag", key: "reminder_on", relation: "=", value: "1" },
            { field: "tag", key: "reminder_utc", relation: "=", value: slot },
        ],
        headings: { en: "Time to move 💪" },
        contents: { en: "Your 15-min home workout is ready." },
        url: "/session",
    });
    const res = await fetch(`${API_URL}/notifications?c=push`, {
        body,
        method: "POST",
        headers: _getHeaders(),
    });
    if (!res.ok) throw new Error(`OneSignal ${res.status}: ${await res.text()}`);
    return res.json() != null;
}

async function runPush(opts: {
    userId: string;
    sendAt: Date;
    title: string;
    body: string;
    url?: string;
    ringtoneId?: string;
}) {
    const idempotencyKey = generateUUIDFromString(
        `${opts.userId}-${opts.sendAt.toISOString()}-${opts.title}-${opts.body}`,
    );
    const body = JSON.stringify({
        url: opts.url,
        app_id: APP_ID,
        target_channel: "push",
        headings: { en: opts.title },
        contents: { en: opts.body },
        idempotency_key: idempotencyKey,
        send_after: opts.sendAt.toISOString(),
        include_aliases: { external_id: [opts.userId] },
        data: { ringtoneId: opts.ringtoneId },
    });
    const res = await fetch(`${API_URL}/notifications?c=push`, {
        method: "POST",
        body,
        headers: _getHeaders(),
    });

    if (!res.ok) throw new Error(`OneSignal ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error("OneSignal returned no notification id");
    return data.id;
}

/* ---------- Helpers function to consistent headers ---------- */
function _getHeaders() {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("Authorization", `Key ${REST_API_KEY}`);
    return headers;
}

/* ---------- time helpers ---------- */
function parseTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes))
        throw new Error("Invalid Time: " + time);
    return { hours, minutes };
}

// Wall-clock parts of an instant, as seen in the given time zone
function zonedParts(ms: number, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric",
        month: "numeric", // 1-12 (from Intl)
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    }).formatToParts(new Date(ms));

    const p: Record<string, number> = {};
    for (const part of parts) if (part.type !== "literal") p[part.type] = Number(part.value);
    return p as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
}

// Offset (ms) of the zone from UTC at a given instant
function tzOffset(ms: number, timeZone: string) {
    const p = zonedParts(ms, timeZone);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asUTC - Math.floor(ms / 1000) * 1000;
}

// Convert a wall-clock time in a zone to the real UTC instant (DST-safe)
// mo is 0-based (0=Jan ... 11=Dec), same as Date.UTC
function wallToInstant(
    y: number,
    mo: number,
    d: number,
    h: number,
    mi: number,
    timeZone: string,
): Date {
    const guess = Date.UTC(y, mo, d, h, mi);
    const off1 = tzOffset(guess, timeZone);
    let t = guess - off1;
    const off2 = tzOffset(t, timeZone); // differs only if we crossed a DST change
    if (off2 !== off1) t = guess - off2;
    return new Date(t);
}

// days: 0=Sun, 1=Mon, ... 6=Sat
function getSendTimes(
    days: number[],
    time: string,
    timeZone: string,
    minDateMs: number | null = null,
): Date[] {
    const { hours, minutes } = parseTime(time);
    const wanted = new Set(days);
    const nowMs = Date.now();
    const today = zonedParts(nowMs, timeZone); // user's "today"
    const out: Date[] = [];

    for (let i = 0; i <= MAX_WINDOW_DAYS && out.length < MAX_REMINDER_TO_SCHEDULE; i++) {
        const calender = new Date(
            Date.UTC(
                today.year,
                today.month - 1, // expects (0-11), so subtracting 1.
                today.day + i,
            ),
        );

        const weekday = calender.getUTCDay();
        if (!wanted.has(weekday)) continue;

        // Construct the date instance
        const instant = wallToInstant(
            calender.getUTCFullYear(),
            calender.getUTCMonth(),
            calender.getUTCDate(),
            hours,
            minutes,
            timeZone,
        );

        const instantMs = instant.getTime();

        if (instantMs <= nowMs) continue;
        if (minDateMs && instantMs <= minDateMs) continue;

        out.push(instant);
    }
    return out;
}
