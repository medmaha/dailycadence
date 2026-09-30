import { playRingtone, Ringtone } from "@/lib/ringtones";
import { useEffect } from "react";

export function NotificationSound() {
    useEffect(() => {
        const handleSWMessage = (event: MessageEvent) => {
            const ringtone: Ringtone = event.data.ringtone;
            if (ringtone || event.data?.type === "cadence:play-ringtone") {
                playRingtone(ringtone).catch(console.error);
            }
        };
        navigator.serviceWorker?.addEventListener("message", handleSWMessage);
        return () => {
            navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
        };
    }, []);

    return null;
}
