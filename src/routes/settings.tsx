import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button, Card, Chip, Eyebrow, Screen } from "@/components/ui-kit";
import { clearToday, resetAll, useProfile } from "@/lib/store";
import { Equipment, Level, Goal } from "@/lib/types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Setup - Cadence" },
      {
        name: "description",
        content: "Adjust your goal, equipment, session length and experience level at any time.",
      },
      { property: "og:title", content: "Setup - Cadence" },
      {
        property: "og:description",
        content: "Change goal, equipment and session length - the next session adapts immediately.",
      },
    ],
  }),
  component: Settings,
});

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

function Settings() {
  const navigate = useNavigate();
  const [profile, setProfile, profileLoading] = useProfile();

  if (profileLoading || !profile) {
    return (
      <Screen>
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-surface" />
      </Screen>
    );
  }

  const update = (patch: Partial<typeof profile>) => {
    clearToday();
    setProfile({ ...profile, ...patch });
  };

  return (
    <Screen>
      <header className="animate-rise">
        <Eyebrow>Setup</Eyebrow>
        <h1 className="mt-2 text-4xl font-semibold">Your training inputs</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Change anything - the next session is rebuilt from it.
        </p>
      </header>

      <Card className="mt-6 space-y-6 animate-rise">
        <Group label="Goal">
          {GOALS.map((g) => (
            <Chip key={g.id} selected={profile.goal === g.id} onClick={() => update({ goal: g.id })}>
              {g.label}
            </Chip>
          ))}
        </Group>

        <Group label="Equipment">
          {EQUIPMENT.map((e) => (
            <Chip
              key={e.id}
              selected={profile.equipment.includes(e.id)}
              onClick={() => {
                const next = profile.equipment.includes(e.id)
                  ? profile.equipment.filter((x) => x !== e.id)
                  : [...profile.equipment, e.id];
                update({ equipment: next.length ? next : ["none"] });
              }}
            >
              {e.label}
            </Chip>
          ))}
        </Group>

        <Group label="Session length">
          {TIMES.map((t) => (
            <Chip key={t} selected={profile.minutes === t} onClick={() => update({ minutes: t })}>
              {t} min
            </Chip>
          ))}
        </Group>

        <Group label="Experience">
          {LEVELS.map((l) => (
            <Chip key={l.id} selected={profile.level === l.id} onClick={() => update({ level: l.id })}>
              {l.label}
            </Chip>
          ))}
        </Group>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate({ to: "/onboarding" })}>
          Run setup again
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (confirm("Delete all sessions and settings on this device?")) {
              resetAll();
              navigate({ to: "/onboarding" });
            }
          }}
        >
          Erase all data
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Everything stays on this device, so sessions and timers keep working with no connection.
      </p>
    </Screen>
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
