import { Eyebrow } from "@/components/ui-kit";
import type { Reminder } from "@/lib/reminders";
import type { Ringtone } from "@/lib/ringtones";
import { ReminderItem } from "./ReminderItem";

type ReminderListProps = {
    reminders: Reminder[];
    ringtones: Ringtone[];
    onToggle: (id: string, enabled: boolean) => void;
    onEdit: (reminder: Reminder) => void;
    onDelete: (id: string) => void;
};

export function ReminderList({
    reminders,
    ringtones,
    onToggle,
    onEdit,
    onDelete,
}: ReminderListProps) {
    return (
        <div>
            <Eyebrow>Reminders</Eyebrow>
            <div className="mt-3 space-y-3">
                {reminders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No reminders set. Add one to get daily workout notifications.
                    </p>
                ) : (
                    reminders.map((reminder) => {
                        const ringtone =
                            ringtones.find((r) => r.id === reminder.ringtoneId) ?? ringtones[0];
                        if (!ringtone) return null;

                        return (
                            <ReminderItem
                                key={reminder.id}
                                reminder={reminder}
                                ringtoneName={ringtone.name}
                                onToggle={(enabled) => onToggle(reminder.id, enabled)}
                                onEdit={() => onEdit(reminder)}
                                onDelete={() => onDelete(reminder.id)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
