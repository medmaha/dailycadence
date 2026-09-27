import { startReminderChecks } from "./reminders";
import { registerSW } from "virtual:pwa-register";

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
        registerSW({
            immediate: true,
            onNeedReload() {
                // defer reload to next spa navigation
                if (confirm("New version available. Update required")) {
                    window.location.reload()
                }
            },
            onRegisteredSW() {
                startReminderChecks();
            }
        });
    } catch {
        /* offline support is optional */
    }
}
