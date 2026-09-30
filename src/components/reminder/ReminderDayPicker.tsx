import { DAYS } from "./constants";

type DayPickerProps = {
    value: number[];
    onChange: (days: number[]) => void;
};

export function ReminderDayPicker({ value, onChange }: DayPickerProps) {
    const toggleDay = (dayId: number) => {
        onChange(value.includes(dayId) ? value.filter((d) => d !== dayId) : [...value, dayId]);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
                <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        value.includes(day.id)
                            ? "border-primary bg-primary/12 text-primary"
                            : "border-border-strong text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {day.label}
                </button>
            ))}
        </div>
    );
}
