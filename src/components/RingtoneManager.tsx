import { useState, useEffect } from "react";

import { Button, Card, Eyebrow } from "@/components/ui-kit";
import {
  getRingtones,
  deleteRingtone,
  uploadRingtone,
  playRingtone,
  type Ringtone,
} from "@/lib/ringtones";
import { PlayIcon, Trash2Icon } from "lucide-react";
import { useRingtoneStore } from "@/stores/ringtoneStore";
import { usePushNotificationStore } from "@/stores/notificationStore";

export function RingtoneManager() {
  const ringtones = useRingtoneStore(s => s.ringtones)

  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setNotificationEnabled(usePushNotificationStore.getState().isNotificationsEnabled());
  }, [])

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

  const handleDeleteRingtone = (id: string) => {
    if (confirm("Are you sure you want to delete this ringtone?")) {
      deleteRingtone(id);
    }
  };

  const handlePlayRingtone = (ringtone: Ringtone) => {
    playRingtone(ringtone.id);
  };

  if (!notificationEnabled) return
  const customRingtones = ringtones.filter(r => !r.isDefault);

  return (
    <Card className="mt-6 animate-rise">
      <div className="space-y-4">
        <div>
          <Eyebrow>Custom Ringtones</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload up to 3 custom ringtones (max 500KB each). Audio will be compressed automatically.
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
              className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:animate-pop disabled:pointer-events-none disabled:opacity-40 px-4 py-2.5 text-sm border border-border-strong bg-surface text-foreground hover:bg-surface-2 cursor-pointer ${isUploading ? "opacity-50 cursor-not-allowed" : ""
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
              <div
                key={ringtone.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-2 px-3"
              >
                <div className="flex-1">
                  <p className="font-medium capitalize">{ringtone.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Math.round(ringtone.dataUrl.length * 0.75 / 1024)}KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="icon"
                    className="bg-primary/10 hover:bg-primary/20 border border-primary/50"
                    onClick={() => handlePlayRingtone(ringtone)}
                  >
                    <PlayIcon className="w-4 h-4 text-white fill-white" />
                  </Button>
                  <Button
                    variant="danger"
                    size="icon"
                    className="bg-destructive/10 hover:bg-destructive/20 border border-destructive/50"
                    onClick={() => handleDeleteRingtone(ringtone.id)}
                  >
                    <Trash2Icon className="w-4 h-4 text-white fill-white" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}