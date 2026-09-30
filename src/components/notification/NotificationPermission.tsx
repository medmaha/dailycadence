import { Button, Eyebrow } from "@/components/ui-kit";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

type NotificationPermissionProps = {
    enabled: boolean;
    onRequestPermission: () => Promise<void>;
};

export function NotificationPermission({
    enabled,
    onRequestPermission,
}: NotificationPermissionProps) {
    const [loading, setLoading] = useState(false);

    const handleRequest = async () => {
        if (loading) return;
        try {
            setLoading(true);
            await onRequestPermission();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Eyebrow>Notifications</Eyebrow>
            <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {enabled
                        ? "Notifications enabled"
                        : "Enable notifications to receive workout reminders"}
                </p>
                {!enabled && (
                    <Button size="md" onClick={handleRequest}>
                        Enable
                        {loading && <Loader2Icon className="animate-spin w-4 h-4" />}
                    </Button>
                )}
            </div>
        </div>
    );
}
