import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { Screen } from "@/components/ui-kit";
import { TodayHeader } from "@/components/TodayHeader";
import { WorkoutCard } from "@/components/WorkoutCard";
import { generateWorkout } from "@/lib/generator";
import { computeStreak, todayKey } from "@/lib/store";
import { useActiveSession, useTodayWorkout } from "@/hooks/exercise";
import { useProfileHistory, useProfile } from "@/hooks/profile";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "Daily Cadence - home training" },
            {
                name: "description",
                content:
                    "Cadence builds one adaptive home workout a day from what you trained recently. No equipment needed, works offline.",
            },
            { property: "og:title", content: "Today - Cadence home training" },
            {
                property: "og:description",
                content:
                    "One adaptive home session a day, rotated so you never grind the same muscles twice.",
            },
        ],
    }),
    component: Today,
});

function Today() {
    const navigate = useNavigate();
    const [profile, , profileLoading] = useProfile();
    const [history] = useProfileHistory();
    const [workout, setWorkout, workoutLoading] = useTodayWorkout();
    const [active] = useActiveSession();

    const rebuildCount = useRef(0);

    const rebuildWorkout = useCallback(() => {
        if (!profile) return;

        rebuildCount.current += 1;

        setWorkout(
            generateWorkout(
                profile,
                history ?? [],
                `rebuild-${Date.now()}-${rebuildCount.current}`,
            ),
        );
    }, [profile, history, setWorkout]);

    useEffect(() => {
        if (profileLoading) return;
        if (profile === null && history !== null) navigate({ to: "/onboarding" });
    }, [profile, history, navigate, profileLoading]);

    useEffect(() => {
        if (profileLoading) return;
        if (!profile || !history) return;
        if (!workout || workout.date !== todayKey()) {
            setWorkout(generateWorkout(profile, history));
        }
    }, [profile, history, workout, setWorkout, profileLoading, workoutLoading]);

    const streak = useMemo(() => computeStreak(history ?? []), [history]);
    const doneToday = (history ?? []).some((h) => h.date === todayKey());

    if (profileLoading || workoutLoading || !profile || !workout) {
        return (
            <Screen>
                <div className="h-10 w-28 animate-pulse rounded-lg bg-surface" />
                <div className="mt-6 h-56 animate-pulse rounded-2xl bg-surface" />
            </Screen>
        );
    }

    const dateLabel = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
    });

    return (
        <Screen>
            <TodayHeader
                dateLabel={dateLabel}
                doneToday={doneToday}
                workoutKind={workout.kind}
                streak={streak}
                sessionCount={(history ?? []).length}
            />

            <WorkoutCard
                workout={workout}
                hasActiveSession={!!active}
                onRebuild={rebuildWorkout}
                historyCount={(history ?? []).length}
            />
        </Screen>
    );
}
