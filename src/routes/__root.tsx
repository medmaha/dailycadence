import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    Outlet,
    Link,
    createRootRouteWithContext,
    useRouter,
    HeadContent,
    Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { useAppStore } from "@/stores/appStore";
import { randomUUID } from "@/lib/utils";
import { initIndexedDB } from "@/lib/indexedDb";
import { usePushNotificationStore } from "@/stores/notificationStore";
import { NotificationSound } from "@/components/notification/NotificationSound";
import StartReminderChecks from "@/providers/SchedulerProvider";

declare global {
    interface Window {
        _REMINDERS_KEY: string;
        _RINGTONES_KEY: string;
        _SOUND_ENABLED_KEY: string;
        _DEFAULT_RINGTONE: Record<string, any>;
    }
}

function NotFoundComponent() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
            <div className="max-w-md text-center">
                <h1 className="text-4xl font-bold text-foreground">404</h1>
                <h2 className="mt-4 text-2xl font-semibold text-foreground">Page not found</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    The Page you're looking for doesn't exist or has been moved.
                </p>
                <div className="mt-8">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Back Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
    console.error(error);
    const router = useRouter();

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
            <div className="max-w-md text-center">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    Cadence App Crashes
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Something went wrong on our end. You can try refreshing or start a new workout.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                    <button
                        onClick={() => {
                            router.invalidate();
                            reset();
                        }}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Try again
                    </button>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                        Back Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    // ssr: false,
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1, viewport-fit=cover",
            },
            { title: "Cadence - Adaptive home training" },
            {
                name: "description",
                content: "Adaptive daily home workouts that rotate what you train. Works offline.",
            },
            { property: "og:title", content: "Cadence - Adaptive home training" },
            {
                property: "og:description",
                content: "Adaptive daily home workouts that rotate what you train.",
            },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary" },
            { name: "theme-color", content: "#1b1d24" },
            { name: "apple-mobile-web-app-capable", content: "yes" },
            { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "preconnect", href: "https://fonts.googleapis.com" },
            { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
            {
                rel: "stylesheet",
                href: "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=Space+Grotesk:wght@500;600&display=swap",
            },
            { rel: "icon", type: "image/png", href: "/favicon.png" },
            { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
            { rel: "apple-touch-startup-image", href: "/apple-touch-splash.png" },
            { rel: "manifest", href: "/manifest.webmanifest" },
        ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                {children}
                <Scripts />
            </body>
        </html>
    );
}

function RootComponent() {
    const { queryClient } = Route.useRouteContext();

    useEffect(() => {
        let deviceId = useAppStore.getState().deviceId;
        if (!deviceId) {
            deviceId = randomUUID();
            useAppStore.getState().setDeviceId(deviceId);
        }
        const dateJoined = useAppStore.getState().dateJoined;
        if (!dateJoined) {
            const dateJoined = Date.now();
            useAppStore.getState().setDateJoined(dateJoined);
        }

        void initIndexedDB();
        usePushNotificationStore.getState().refresh();
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Outlet />
            <StartReminderChecks />
            <NotificationSound />
        </QueryClientProvider>
    );
}
