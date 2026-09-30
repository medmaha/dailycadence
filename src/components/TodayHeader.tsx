import { Eyebrow } from "@/components/ui-kit";

interface TodayHeaderProps {
    dateLabel: string;
    doneToday: boolean;
    workoutKind: string;
    streak: number;
    sessionCount: number;
}

export function TodayHeader({
    dateLabel,
    doneToday,
    workoutKind,
    streak,
    sessionCount,
}: TodayHeaderProps) {
    return (
        <header className="animate-rise">
            <Eyebrow>{dateLabel}</Eyebrow>
            <h1 className="mt-2 text-4xl font-semibold">
                {doneToday
                    ? "Logged. Well done."
                    : workoutKind === "recovery"
                      ? "Ease off today."
                      : "Ready when you are."}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
                {streak > 0 ? `${streak}-day streak` : "No streak yet"} · {sessionCount} sessions
                logged
            </p>
        </header>
    );
}
