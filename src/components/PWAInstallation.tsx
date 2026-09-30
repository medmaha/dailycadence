import { useLoading } from "@/hooks/loading";
import { setupServiceWorker } from "@/lib/pwa";
import { useAppStore } from "@/stores/appStore";
import { useEffect, useState } from "react";
import { Button, Card, Dialog } from "./ui-kit";

type Platform = "ios" | "android" | "desktop";
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallation() {
    const isLoading = useLoading();
    const userId = useAppStore((s) => s.deviceId);

    const [platform, setPlatform] = useState<Platform>("desktop");
    const [standalone, setStandalone] = useState(false);
    const [dismissed, setDismissed] = useState(true); // hidden until we read the flag
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installing, setInstalling] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    // Read platform + first-time flag once, on the client.
    useEffect(() => {
        setPlatform(detectPlatform());
        setStandalone(isStandaloneMode());
        setDismissed(getDismissRemainingMs() > 0);
    }, []);

    // Capture Chromium's install prompt (Android Chrome, desktop Chrome/Edge).
    useEffect(() => {
        const onBeforeInstall = (e: Event) => {
            e.preventDefault(); // stop the mini-infobar, we show our own UI
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };
        const onInstalled = () => {
            markPromptSeen();
            setDismissed(true);
            setStandalone(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("beforeinstallprompt", onBeforeInstall);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    // Re-show the prompt once the 15-minute dismissal cookie expires.
    useEffect(() => {
        if (!dismissed || standalone) return;

        const remaining = getDismissRemainingMs();
        if (remaining <= 0) {
            setDismissed(false);
            return;
        }

        const t = setTimeout(() => setDismissed(false), remaining);
        return () => clearTimeout(t);
    }, [dismissed, standalone]);

    function handleDismiss() {
        markPromptSeen();
        setDismissed(true);
    }

    async function handleInstall() {
        if (installing) return;

        // iOS has no programmatic install; show Share > Add to Home Screen steps.
        if (platform === "ios") {
            setHelpOpen(true);
            return;
        }

        // Browsers with native prompt support (Chrome/Edge on Android + desktop).
        if (deferredPrompt) {
            try {
                setInstalling(true);
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                setDeferredPrompt(null); // a prompt event can only be used once

                if (outcome === "accepted") {
                    await setupServiceWorker(userId);
                }
                markPromptSeen();
                setDismissed(true);
            } catch (error) {
                console.error("Failed to install app:", error);
            } finally {
                setInstalling(false);
            }
            return;
        }

        // No native prompt (Safari/Firefox desktop, Firefox Android, etc.):
        // still register the SW, then show manual instructions.
        try {
            setInstalling(true);
            await setupServiceWorker(userId);
        } catch (error) {
            console.error("Failed to register service worker:", error);
        } finally {
            setInstalling(false);
        }
        setHelpOpen(true);
    }

    if (isLoading) return null;
    if (standalone) return null; // already running as an installed app
    if (dismissed) return null; // user has already seen the prompt once

    const copy = {
        ios: "Add this app to your Home Screen for a faster, full-screen experience.",
        android: "Install this app on your phone for quick access and offline support.",
        desktop: "Install this app on your computer for quick access in its own window.",
    }[platform];

    return (
        <div className="mt-5 border-t-2 pt-5">
            <Card className="bg-card/50">
                <div>{platform === "desktop" ? "Install App" : "Install To Home Screen"}</div>

                <p className="mb-4 mt-1 text-muted-foreground">{copy}</p>

                <div className="flex gap-2">
                    <Button className="rounded-md" onClick={handleInstall} disabled={installing}>
                        {installing
                            ? "Installing..."
                            : platform === "ios"
                              ? "How to Install"
                              : "Install App"}
                    </Button>
                    <Button className="rounded-md" onClick={handleDismiss} disabled={installing}>
                        Not now
                    </Button>
                </div>
            </Card>

            <InstructionsDialog
                platform={platform}
                isOpen={helpOpen}
                onClose={(settled) => {
                    if (settled) {
                        setHelpOpen(false);
                        markPromptSeen();
                        setDismissed(true);
                    }
                }}
            />
        </div>
    );
}

function InstructionsDialog({
    platform,
    isOpen,
    onClose,
}: {
    platform: Platform;
    isOpen: boolean;
    onClose: (settled?: boolean) => void;
}) {
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Install App"
            className="bg-card text-card-foreground px-2"
        >
            <div className="bg-card text-card-foreground px-2">
                {platform === "ios" ? (
                    <div className=" max-w-2xl mx-auto">
                        <p>To install this app on your iPhone or iPad:</p>
                        <ol className="mt-3 list-decimal pl-5">
                            <li>Tap the Share button in Safari.</li>
                            <li>
                                Select <strong>Add to Home Screen</strong>.
                            </li>
                            <li>
                                Tap <strong>Add</strong>.
                            </li>
                        </ol>
                    </div>
                ) : platform === "android" ? (
                    <div className=" max-w-2xl mx-auto">
                        <p>To install this app on your Android device:</p>
                        <ol className="mt-3 list-decimal pl-5">
                            <li>Open your browser menu (⋮).</li>
                            <li>
                                Tap <strong>Install app</strong> or{" "}
                                <strong>Add to Home screen</strong>.
                            </li>
                            <li>Confirm the install.</li>
                        </ol>
                    </div>
                ) : (
                    <div className=" max-w-2xl mx-auto">
                        <p>To install this app on your computer:</p>
                        <ul className="mt-3 list-disc pl-5">
                            <li>
                                <strong>Chrome / Edge:</strong> click the install icon in the
                                address bar, or open the menu and choose{" "}
                                <strong>Install app</strong>.
                            </li>
                            <li>
                                <strong>Safari (macOS):</strong> File → <strong>Add to Dock</strong>
                                .
                            </li>
                            <li>
                                <strong>Firefox:</strong> desktop Firefox doesn&apos;t support
                                installing web apps.
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </Dialog>
    );
}

function detectPlatform(): Platform {
    const ua = navigator.userAgent;

    // iPadOS 13+ reports itself as a Mac, so also check touch points.
    const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) return "ios";

    if (/Android/i.test(ua)) return "android";

    return "desktop";
}

function isStandaloneMode(): boolean {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error - iOS Safari specific property
        window.navigator.standalone === true
    );
}

const INSTALL_PROMPT_COOKIE = "cadence.installPrompt.v1";
const DISMISS_MILLISECONDS = 15 * 60 * 1000;

function getDismissRemainingMs(): number {
    const match = document.cookie
        .split("; ")
        .find((c) => c.startsWith(`${INSTALL_PROMPT_COOKIE}=`));
    if (!match) return 0;

    const expiresAt = Number(match.split("=")[1]);
    return Number.isFinite(expiresAt) ? Math.max(0, expiresAt - Date.now()) : 0;
}

function markPromptSeen() {
    const expiresAt = Date.now() + DISMISS_MILLISECONDS;
    document.cookie = `${INSTALL_PROMPT_COOKIE}=${expiresAt}; max-age=${DISMISS_MILLISECONDS / 1000}; path=/; SameSite=Lax`;
}
