import { useEffect, useState } from "react";

import { Button } from "@/components/ui-kit";
import {
    addReminder,
    deleteReminder,
    updateReminder,
    getReminders,
    type Reminder,
} from "@/lib/reminders";
import { getRingtones } from "@/lib/ringtones";
import { setupServiceWorker } from "@/lib/pwa";
import { useAppStore } from "@/stores/appStore";
import { usePushNotificationStore } from "@/stores/notificationStore";
import { useReminderStore } from "@/stores/reminderStore";
import { useRingtoneStore } from "@/stores/ringtoneStore";

import { NotificationPermission } from "@/components/notification/NotificationPermission";
import { ReminderFormDialog, type ReminderFormValues } from "./ReminderFormDialog";
import { ReminderList } from "./ReminderList";
import { RingtoneSoundSetting } from "@/components/ringtone/RingtoneSoundSetting";

type DialogState = { mode: "add" } | { mode: "edit"; reminder: Reminder } | null;

export function ReminderSettings() {
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [dialog, setDialog] = useState<DialogState>(null);

    const ringtones = useRingtoneStore((s) => s.ringtones);
    const setRingtones = useRingtoneStore((s) => s.setRingtones);
    const reminders = useReminderStore((s) => s.reminders);
    const setReminders = useReminderStore((s) => s.setReminders);

    const refreshNotificationStatus = () =>
        setNotificationEnabled(usePushNotificationStore.getState().isNotificationsEnabled());

    useEffect(() => {
        setReminders(getReminders());
        setRingtones(getRingtones());
        refreshNotificationStatus();
        // trigger sound check and sets state
        usePushNotificationStore.getState().isNotificationsEnabled();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-sync from storage whenever the dialog opens
    useEffect(() => {
        if (dialog) setReminders(getReminders());
    }, [dialog, setReminders]);

    const handleRequestPermission = async () => {
        await setupServiceWorker(useAppStore.getState().deviceId);
        refreshNotificationStatus();
    };

    const handleSubmit = (values: ReminderFormValues) => {
        if (dialog?.mode === "edit") {
            updateReminder(dialog.reminder.id, values);
        } else {
            if (!notificationEnabled) {
                handleRequestPermission();
                return;
            }
            void addReminder({ ...values, enabled: true });
        }
        setDialog(null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure?")) {
            deleteReminder(id);
        }
    };

    const handleToggle = (id: string, enabled: boolean) => {
        updateReminder(id, { enabled });
    };

    return (
        <>
            <div className="space-y-6">
                <NotificationPermission
                    enabled={notificationEnabled}
                    onRequestPermission={handleRequestPermission}
                />

                {notificationEnabled && (
                    <>
                        <RingtoneSoundSetting />
                        <ReminderList
                            reminders={reminders}
                            ringtones={ringtones}
                            onToggle={handleToggle}
                            onEdit={(reminder) => setDialog({ mode: "edit", reminder })}
                            onDelete={handleDelete}
                        />
                        <Button variant="outline" onClick={() => setDialog({ mode: "add" })}>
                            Add reminder
                        </Button>
                    </>
                )}
            </div>

            {dialog && (
                <ReminderFormDialog
                    reminder={dialog.mode === "edit" ? dialog.reminder : null}
                    ringtones={ringtones}
                    onSubmit={handleSubmit}
                    onClose={() => setDialog(null)}
                />
            )}
        </>
    );
}
