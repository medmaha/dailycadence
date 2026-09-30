import { Card, Chip, Eyebrow } from "@/components/ui-kit";
import { Equipment, Level, Goal } from "@/lib/types";

const GOALS: { id: Goal; label: string }[] = [
    { id: "strength", label: "Strength" },
    { id: "mobility", label: "Mobility" },
    { id: "endurance", label: "Endurance" },
    { id: "general", label: "General" },
];
const EQUIPMENT: { id: Equipment; label: string }[] = [
    { id: "none", label: "Bodyweight" },
    { id: "bands", label: "Bands" },
    { id: "dumbbells", label: "Dumbbells" },
    { id: "pullupbar", label: "Pull-up bar" },
];
const LEVELS: { id: Level; label: string }[] = [
    { id: "new", label: "New" },
    { id: "returning", label: "Getting back" },
    { id: "trained", label: "Consistent" },
];
const TIMES = [10, 20, 30, 45];

interface ProfileSettingsProps {
    goal: Goal;
    equipment: Equipment[];
    minutes: number;
    level: Level;
    onUpdate: (patch: {
        goal?: Goal;
        equipment?: Equipment[];
        minutes?: number;
        level?: Level;
    }) => void;
}

export function ProfileSettings({
    goal,
    equipment,
    minutes,
    level,
    onUpdate,
}: ProfileSettingsProps) {
    return (
        <Card className="space-y-6 animate-rise">
            <Group label="Goal">
                {GOALS.map((g) => (
                    <Chip
                        key={g.id}
                        selected={goal === g.id}
                        onClick={() => onUpdate({ goal: g.id })}
                    >
                        {g.label}
                    </Chip>
                ))}
            </Group>

            <Group label="Equipment">
                {EQUIPMENT.map((e) => (
                    <Chip
                        key={e.id}
                        selected={equipment.includes(e.id)}
                        onClick={() => {
                            const next = equipment.includes(e.id)
                                ? equipment.filter((x) => x !== e.id)
                                : [...equipment, e.id];
                            onUpdate({ equipment: next.length ? next : ["none"] });
                        }}
                    >
                        {e.label}
                    </Chip>
                ))}
            </Group>

            <Group label="Session length">
                {TIMES.map((t) => (
                    <Chip key={t} selected={minutes === t} onClick={() => onUpdate({ minutes: t })}>
                        {t} min
                    </Chip>
                ))}
            </Group>

            <Group label="Experience">
                {LEVELS.map((l) => (
                    <Chip
                        key={l.id}
                        selected={level === l.id}
                        onClick={() => onUpdate({ level: l.id })}
                    >
                        {l.label}
                    </Chip>
                ))}
            </Group>
        </Card>
    );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <Eyebrow>{label}</Eyebrow>
            <div className="mt-3 flex flex-wrap gap-2">{children}</div>
        </div>
    );
}
