import { useState, useEffect } from "react";

import { Card, Eyebrow } from "@/components/ui-kit";
import { uploadRingtone } from "@/lib/ringtones";
import { useRingtoneStore } from "@/stores/ringtoneStore";
import { usePushNotificationStore } from "@/stores/notificationStore";
import { RingtoneItem } from "./RingtoneItem";

export function RingtoneManager() {
    const ringtones = useRingtoneStore((s) => s.ringtones);

    const notificationPerms = usePushNotificationStore((s) => s.permission);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        usePushNotificationStore.getState().refresh();
    }, []);

    useEffect(() => {
        setNotificationEnabled(usePushNotificationStore.getState().isNotificationsEnabled());
    }, [notificationPerms]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);
        setIsUploading(true);

        try {
            await uploadRingtone(file);
            setUploadError(null);
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : "Failed to upload ringtone");
        } finally {
            setIsUploading(false);
        }

        // Reset file input
        e.target.value = "";
    };

    if (!notificationEnabled) return;
    const customRingtones = ringtones.filter((r) => !r.isDefault);

    return (
        <Card className="mt-6 animate-rise">
            <div className="space-y-4">
                <div>
                    <Eyebrow>Custom Ringtones</Eyebrow>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Upload up to 3 custom ringtones (max 500KB each). Audio will be compressed
                        automatically.
                    </p>
                </div>

                {customRingtones.length < 3 && (
                    <div>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            className="hidden"
                            id="ringtone-upload"
                        />
                        <label
                            htmlFor="ringtone-upload"
                            className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:animate-pop disabled:pointer-events-none disabled:opacity-40 px-4 py-2.5 text-sm border border-border-strong bg-surface text-foreground hover:bg-surface-2 cursor-pointer ${
                                isUploading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        >
                            {isUploading ? "Uploading..." : "Upload ringtone"}
                        </label>
                        {uploadError && (
                            <p className="mt-2 text-sm text-destructive">{uploadError}</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    {customRingtones.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No custom ringtones uploaded yet.
                        </p>
                    ) : (
                        customRingtones.map((ringtone) => (
                            <RingtoneItem ringtone={ringtone} key={ringtone.id} />
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}
