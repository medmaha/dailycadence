import { readEnv } from "@/lib/helpers";

const APP_NAME = readEnv("VITE_APP_NAME", "Cadence");
const STORAGE_VERSION = readEnv("VITE_STORAGE_VERSION", "1.0.0");

const appName = APP_NAME.toLowerCase();
const APP = `${appName}.app.${STORAGE_VERSION}`;
const PROFILE = `${appName}.profile.${STORAGE_VERSION}`;
const RINGTONES = `${appName}.ringtones.${STORAGE_VERSION}`;
const REMINDERS = `${appName}.reminders.${STORAGE_VERSION}`;
const EXERCISES = `${appName}.exercise.${STORAGE_VERSION}`;
const PUSH_NOTIFICATION = `${appName}.push-notify.${STORAGE_VERSION}`;

export const STORAGE_KEYS = {
    APP,
    PROFILE,
    RINGTONES,
    REMINDERS,
    EXERCISES,
    PUSH_NOTIFICATION,
    APP_NAME,
    APP_VERSION: 1,
} as const;
