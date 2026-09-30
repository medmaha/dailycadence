import { type Ringtone } from "@/lib/ringtones";
import { RingtoneItem } from "./RingtoneItem";
import { cn } from "@/lib/utils";

type RingtonePickerProps = {
    ringtones: Ringtone[];
    value: string;
    onChange: (id: string) => void;
};

export function RingtonePicker({ ringtones, value, onChange }: RingtonePickerProps) {
    return (
        <div className="space-y-2">
            {ringtones.map((ringtone) => {
                const selected = value === ringtone.id;
                return (
                    <RingtoneItem
                        ringtone={ringtone}
                        key={ringtone.id}
                        onClick={() => onChange(ringtone.id)}
                        className={cn(
                            `bg-surface cursor-pointer transition-colors hover:border-border-strong`,
                            selected && "border-primary bg-primary/12",
                        )}
                    />
                );
            })}
        </div>
    );
}
