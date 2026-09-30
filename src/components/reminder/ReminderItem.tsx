import { Button } from "@/components/ui-kit";
import type { Reminder } from "@/lib/reminders";
import { DAYS } from "./constants";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { Trash2Icon } from "lucide-react";

type ReminderItemProps = {
    reminder: Reminder;
    ringtoneName?: string;
    onToggle: (enabled: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
};

export function ReminderItem({
    reminder,
    ringtoneName,
    onToggle,
    onEdit,
    onDelete,
}: ReminderItemProps) {
    const dayLabels = reminder.days
        .map((d) => DAYS.find((day) => day.id === d)?.label)
        .filter(Boolean)
        .join(", ");

    return (
        <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1 flex items-center gap-2">
                    <p className="font-display text-lg">{reminder.time}</p>
                    <ToggleSwitch
                        checked={reminder.enabled}
                        onChange={onToggle}
                        label={`Toggle reminder at ${reminder.time}`}
                    />
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" className="px-2" size="md" onClick={onEdit}>
                        Edit
                    </Button>
                    <Button variant="ghost" className="px-2" size="md" onClick={onDelete}>
                        <Trash2Icon className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="">
                <p className="mt-1 text-xs text-muted-foreground">{dayLabels}</p>
                <p className="mt-1 text-sm">{reminder.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">Ringtone: {ringtoneName}</p>
            </div>
        </div>
    );
}
