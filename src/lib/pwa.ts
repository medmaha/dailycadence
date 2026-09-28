import { initNotificationSettings } from "./push-notification";
import { initReminderSettings, startReminderChecks } from "./reminders";
import { initRingtoneSettings } from "./ringtones";

/**
 * Service worker registrar for the app shell.
 * It refuses to register in certain contexts:
 * - If not running in a browser (i.e., not on the client)
 * - If the current window is an iframe or a popup
 * - If the current window's hostname includes "preview" or "beta"
 * - If the current URL includes a query parameter "sw=off"
 */
function isBlockedContext() {
    if (typeof window === "undefined") return true;
    if (window.self !== window.top) return true; // Iframe or popups

    const host = window.location.hostname;
    // Disallow registration in production unless on cadence domain
    // if (!host.includes("cadence") && import.meta.env.PROD) return true;

    // Disallow registration on preview domains
    if (host.includes("preview") || host.includes("beta")) return true;

    // Disallow registration if the URL includes a query parameter "sw=off"
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;

    return false;
}

/**
 * Attempts to register the service worker if not in a blocked context.
 * If the service worker is already registered but in a blocked context,
 * it unregisters the service worker.
 */
export async function setupServiceWorker() {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // Check if the current context is blocked from registering the service worker
    if (isBlockedContext()) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            // Unregister the service worker if it is registered and in a blocked context
            await Promise.allSettled(
                registrations
                    .filter((r) =>
                        !!(r.active?.scriptURL ?? r.installing?.scriptURL)
                    )
                    .map((r) => r.unregister()),
            );
        } catch {
            /* ignore */
        }
        return;
    }

    try {
        // Register the service worker
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker
            .register("/sw.js", { scope: "/", type: "classic" })
            .then((registration) => {
                initReminderSettings()
                initRingtoneSettings()
                initNotificationSettings()
                // 
                startReminderChecks()
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    newWorker?.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            // A new SW is ready — mirrors onNeedRefresh
                            console.log("New content available, refresh to update.");
                            // e.g. show your own "reload" toast here, or:
                            // newWorker.postMessage({ type: "SKIP_WAITING" });
                        }
                    });
                });
            })
            .catch(console.error);


    } catch {
        /* offline support is optional */
    }
}