import { useState } from "react";
import { Button, Dialog, Input, Textarea } from "@/components/ui-kit";
import type { Reminder } from "@/lib/reminders";
import type { Ringtone } from "@/lib/ringtones";
import { ALL_DAYS, getDefaultMessage, DEFAULT_RINGTONE_ID } from "./constants";
import { ReminderDayPicker } from "./ReminderDayPicker";
import { RingtonePicker } from "@/components/ringtone/RingtonePicker";

export type ReminderFormValues = {
    time: string;
    days: number[];
    message: string;
    ringtoneId: string;
};

type ReminderFormDialogProps = {
    /** Pass a reminder to edit it; omit to create a new one. */
    reminder?: Reminder | null;
    ringtones: Ringtone[];
    onSubmit: (values: ReminderFormValues) => void;
    onClose: () => void;
};

/**
 * Owns its own form state. Mount it only while open — state is initialised
 * from `reminder` on mount, so no manual reset is needed.
 */
export function ReminderFormDialog({
    reminder,
    ringtones,
    onSubmit,
    onClose,
}: ReminderFormDialogProps) {
    const isEditing = !!reminder;

    const [time, setTime] = useState(() => {
        if (reminder?.time) return reminder?.time;

        const today = new Date();
        let hour = Math.min(today.getHours() + 1, 24);
        let minute = Math.min(today.getMinutes() + 5, 60);

        while (minute % 2 !== 0) {
            minute++;
        }
        if (hour >= 24) {
            hour = 0;
        }
        const v = hour.toString().padStart(2, "0") + ":" + minute.toString();
        return v;
    });
    const [days, setDays] = useState<number[]>(reminder?.days ?? ALL_DAYS);
    const [message, setMessage] = useState(reminder?.message ?? getDefaultMessage());
    const [ringtoneId, setRingtoneId] = useState(reminder?.ringtoneId || DEFAULT_RINGTONE_ID);

    return (
        <Dialog
            isOpen
            className="bg-card/95 text-card-foreground px-3"
            onClose={() => {}}
            title={isEditing ? "Edit reminder" : "New reminder"}
        >
            <div className="space-y-4">
                <Field label="Time">
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </Field>

                <Field label="Days">
                    <ReminderDayPicker value={days} onChange={setDays} />
                </Field>

                <Field label="Message">
                    <Textarea
                        value={message}
                        className="resize-none"
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Add message to identify your timer"
                    />
                </Field>

                <Field label="Ringtone">
                    <RingtonePicker
                        ringtones={ringtones}
                        value={ringtoneId}
                        onChange={setRingtoneId}
                    />
                </Field>

                <div className="flex gap-2 border-t pt-4">
                    <Button variant="outline" className="flex-1" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => onSubmit({ time, days, message, ringtoneId })}
                    >
                        {isEditing ? "Update" : "Add"}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm text-muted-foreground mb-2">{label}</label>
            {children}
        </div>
    );
}
