import { useEffect, useState } from "react";

import type { SessionLog } from "./types";
import { useProfileStore } from "@/stores/profileStore";
import { useExerciseStore } from "@/stores/exerciseStore";

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

export function getHistory() {
    return useExerciseStore.getState().history
}

export function getProfile() {
    return useProfileStore.getState().profile
}

export function saveSession(log: SessionLog) {
    useExerciseStore.getState().updateHistory(log)
}

export function clearToday() {
    useExerciseStore.getState().setToday(null)
    useExerciseStore.getState().setActive(null)
}

export function resetAll() {
    clearToday()
    useProfileStore.getState().updateProfile(null)
    useExerciseStore.getState().updateHistory(null)
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
