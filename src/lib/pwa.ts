import { isProd, readEnv } from "./helpers";
import { initOneSignal } from "./onesignal";

const PRODUCTION_URL = readEnv("VITE_PRODUCTION_URL");
const SERVICE_WORKER_FILE_PATH = readEnv("VITE_SERVICE_WORKER_FILE_PATH", "/sw.js");

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

    // Disallow registration in production unless on same domain
    if (PRODUCTION_URL && isProd()) {
        try {
            const prodUrl = new URL(PRODUCTION_URL);
            if (host !== prodUrl.host) return true;
        } catch (error) {
            // ignore
        }
    }

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
export async function setupServiceWorker(userId: string) {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return false;

    // Check if the current context is blocked from registering the service worker
    if (isBlockedContext()) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            // Unregister the service worker if it is registered and in a blocked context
            await Promise.allSettled(
                registrations
                    .filter((r) => !!(r.active?.scriptURL ?? r.installing?.scriptURL))
                    .map((r) => r.unregister()),
            );
        } catch {
            /* ignore */
        }
        return false;
    }

    try {
        // Register the service worker
        if (!("serviceWorker" in navigator)) return false;

        const currentSwUrl = new URL(`${SERVICE_WORKER_FILE_PATH}`, location.origin).href;
        const registrations = await navigator.serviceWorker.getRegistrations();

        await Promise.allSettled(
            registrations.map(async (registration) => {
                if (currentSwUrl !== registration.active?.scriptURL) {
                    await registration.unregister();
                }
            }),
        );

        const currentRegistration = await navigator.serviceWorker.register(currentSwUrl, {
            scope: "/",
            type: "classic",
        });

        currentRegistration.addEventListener("updatefound", () => {
            const newWorker = currentRegistration.installing;
            newWorker?.addEventListener("statechange", () => {
                if (newWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        newWorker.postMessage({ type: "SKIP_WAITING" });
                    }
                }
            });
        });

        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });

        try {
            await initOneSignal(userId);
        } catch (error) {
            currentRegistration.unregister();
            console.error("[setupPWAFeatures]:", error);
        }
        return true;
    } catch {
        /* offline support is optional */
        return false;
    }
}
