import { useCallback, useEffect, useState } from "react";

import type { Profile, SessionLog, Workout, ActiveSession } from "./types";

const KEYS = {
    profile: "cadence.profile.v1",
    history: "cadence.history.v1",
    today: "cadence.today.v1",
    active: "cadence.active.v1",
};

function read<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function write(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage full or blocked */
    }
    window.dispatchEvent(new CustomEvent("cadence:store", { detail: key }));
}

export function todayKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string) {
    const [ay = 0, am = 1, ad = 1] = a.split("-").map(Number);
    const [by = 0, bm = 1, bd = 1] = b.split("-").map(Number);
    const da = Date.UTC(ay, am - 1, ad);
    const db = Date.UTC(by, bm - 1, bd);
    return Math.round((db - da) / 86_400_000);
}

/** Reactive localStorage-backed value. Returns [value, setValue, isLoading] tuple. */
function usePersisted<T>(key: string, fallback: T) {
    const [value, setValue] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setValue(read<T>(key, fallback));
        setIsLoading(false);
        const sync = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail === undefined || detail === key) setValue(read<T>(key, fallback));
        };
        window.addEventListener("cadence:store", sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener("cadence:store", sync);
            window.removeEventListener("storage", sync);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const set = useCallback(
        (next: T | null) => {
            if (next === null) {
                window.localStorage.removeItem(key);
                window.dispatchEvent(new CustomEvent("cadence:store", { detail: key }));
                setValue(fallback);
                return;
            }
            write(key, next);
            setValue(next);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [key],
    );

    return [value, set, isLoading] as const;
}

export function useProfile() {
    return usePersisted<Profile | null>(KEYS.profile, null);
}

export function useHistory() {
    return usePersisted<SessionLog[]>(KEYS.history, []);
}

export function useTodayWorkout() {
    return usePersisted<Workout | null>(KEYS.today, null);
}

export function useActiveSession() {
    return usePersisted<ActiveSession | null>(KEYS.active, null);
}

export function getHistory() {
    return read<SessionLog[]>(KEYS.history, []);
}

export function getProfile() {
    return read<Profile | null>(KEYS.profile, null);
}

export function saveSession(log: SessionLog) {
    const history = getHistory().filter((s) => s.id !== log.id);
    write(KEYS.history, [log, ...history].slice(0, 400));
}

export function clearToday() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(KEYS.today);
    window.localStorage.removeItem(KEYS.active);
    window.dispatchEvent(new CustomEvent("cadence:store"));
}

export function resetAll() {
    if (typeof window === "undefined") return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent("cadence:store"));
}

/** Consecutive-day streak ending today or yesterday. */
export function computeStreak(history: SessionLog[]) {
    const days = Array.from(new Set(history.map((h) => h.date)))
        .sort()
        .reverse();
    if (days.length === 0) return 0;
    const today = todayKey();
    const gap = daysBetween(days[0]!, today);
    if (gap > 1) return 0;
    let streak = 1;
    for (let i = 1; i < days.length; i++) {
        if (daysBetween(days[i]!, days[i - 1]!) === 1) streak++;
        else break;
    }
    return streak;
}
