import OneSignal from "react-onesignal";
import { readEnv } from "./helpers";

let initialized = false;
const APP_ID = readEnv("VITE_ONESIGNAL_APP_ID");
const VITE_ONESIGNAL_SAFARI_WEB_ID = readEnv("VITE_ONESIGNAL_SAFARI_WEB_ID");

export async function initOneSignal(userId: string) {
    if (initialized || !APP_ID) return;

    // Attempt a logout first
    await logout(userId);

    await OneSignal.init({
        appId: APP_ID,
        safari_web_id: VITE_ONESIGNAL_SAFARI_WEB_ID,
        serviceWorkerPath: "sw.js",
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
        serviceWorkerParam: {
            scope: "/",
        },
    });
    initialized = true;
    await askPermission();
    await identifyUser(userId);
}

async function askPermission() {
    if (!OneSignal.Notifications.permission) await OneSignal.Notifications.requestPermission();
}

async function identifyUser(userId: string) {
    await OneSignal.login(userId);
    OneSignal.User.addTag("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);
}

async function logout(userId: string) {
    try {
        if (OneSignal.User.externalId !== userId && OneSignal.User.externalId) {
            await OneSignal.logout();
        }
    } catch (error) {
        console.error(error);
    }
}
