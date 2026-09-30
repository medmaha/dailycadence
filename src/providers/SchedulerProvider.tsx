import { useLoading } from "@/hooks/loading";
import { startReminderChecks, stopReminderChecks } from "@/lib/scheduler";
import { useEffect } from "react";

export default function StartReminderChecks() {
    const isLoading = useLoading();
    useEffect(() => {
        if (isLoading) return;
        void startReminderChecks();
        return () => {
            stopReminderChecks();
        };
    }, [isLoading]);
    return null;
}
