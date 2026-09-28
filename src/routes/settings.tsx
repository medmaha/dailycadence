import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Card, Eyebrow, Screen } from "@/components/ui-kit";
import { ReminderSettings } from "@/components/ReminderSettings";
import { ProfileSettings } from "@/components/ProfileSettings";
import { SettingsActions } from "@/components/SettingsActions";
import { clearToday, resetAll } from "@/lib/store";
import { useProfile } from "@/hooks/profile";
import { RingtoneManager } from "@/components/RingtoneManager";

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
        <p className="my-3 text-sm text-muted-foreground">
          Change anything - the next session is rebuilt from it.
        </p>
      </header>

      <ProfileSettings
        goal={profile.goal}
        equipment={profile.equipment}
        minutes={profile.minutes}
        level={profile.level}
        onUpdate={update}
      />

      <Card className="mt-6 animate-rise">
        <ReminderSettings />
      </Card>

      <RingtoneManager />

      <SettingsActions
        onRunSetup={() => navigate({ to: "/onboarding" })}
        onEraseData={() => {
          if (confirm("Delete all sessions and settings on this device?")) {
            resetAll();
            navigate({ to: "/onboarding" });
          }
        }}
      />
    </Screen>
  );
}
