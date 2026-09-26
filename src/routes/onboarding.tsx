import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Button, Chip, Eyebrow, Screen } from "@/components/ui-kit";
import { clearToday, useProfile } from "@/lib/store";
import type { Equipment, Level, Goal } from "@/lib/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your training - Cadence" },
      {
        name: "description",
        content: "Tell Cadence your goal, equipment, session length and experience. Takes 30 seconds.",
      },
      { property: "og:title", content: "Set up your training - Cadence" },
      {
        property: "og:description",
        content: "Goal, equipment, time and experience - then Cadence plans every session for you.",
      },
    ],
  }),
  component: Onboarding,
});

const GOALS: { id: Goal; label: string; blurb: string }[] = [
  { id: "strength", label: "Strength", blurb: "Harder progressions, longer rests" },
  { id: "mobility", label: "Mobility", blurb: "Range of motion and control" },
  { id: "endurance", label: "Endurance", blurb: "Circuits, shorter rests" },
  { id: "general", label: "General fitness", blurb: "A balanced mix of everything" },
];

const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: "none", label: "Bodyweight only" },
  { id: "bands", label: "Resistance bands" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "pullupbar", label: "Pull-up bar" },
];

const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: "new", label: "New to this", blurb: "Little or no recent training" },
  { id: "returning", label: "Getting back", blurb: "Trained before, out of rhythm" },
  { id: "trained", label: "Consistent", blurb: "Training most weeks already" },
];

const TIMES = [10, 20, 30, 45];

function Onboarding() {
  const navigate = useNavigate();
  const [, setProfile] = useProfile();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>("general");
  const [equipment, setEquipment] = useState<Equipment[]>(["none"]);
  const [minutes, setMinutes] = useState(20);
  const [level, setLevel] = useState<Level>("returning");

  const toggleEquipment = (id: Equipment) => {
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  };

  const finish = () => {
    clearToday();
    setProfile({
      goal,
      equipment: equipment.length ? equipment : ["none"],
      minutes,
      level,
      createdAt: new Date().toISOString(),
    });
    navigate({ to: "/" });
  };

  return (
    <Screen nav={false} className="pb-16">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-0.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-2"}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <section className="mt-10 animate-rise">
          <Eyebrow>Cadence</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold">What are you training for?</h1>
          <div className="mt-8 space-y-3">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoal(g.id)}
                className={`ring-focus w-full rounded-xl border p-4 text-left transition-colors active:animate-pop ${goal === g.id ? "border-primary bg-primary/8" : "border-border bg-surface"
                  }`}
              >
                <p className="font-display text-lg">{g.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{g.blurb}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="mt-10 animate-rise">
          <Eyebrow>Step 2</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold">What do you have at home?</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Pick everything you can reach. Bodyweight alone is plenty.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {EQUIPMENT.map((e) => (
              <Chip
                key={e.id}
                selected={equipment.includes(e.id)}
                onClick={() => toggleEquipment(e.id)}
              >
                {e.label}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-10 animate-rise">
          <Eyebrow>Step 3</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold">How long is a good session?</h1>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {TIMES.map((t) => (
              <button
                key={t}
                onClick={() => setMinutes(t)}
                className={`ring-focus rounded-xl border p-5 text-left transition-colors active:animate-pop ${minutes === t ? "border-primary bg-primary/8" : "border-border bg-surface"
                  }`}
              >
                <p className="tabular font-display text-3xl">{t}</p>
                <p className="mt-1 text-xs text-muted-foreground">minutes</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-10 animate-rise">
          <Eyebrow>Last one</Eyebrow>
          <h1 className="mt-3 text-4xl font-semibold">Where are you starting from?</h1>
          <div className="mt-8 space-y-3">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`ring-focus w-full rounded-xl border p-4 text-left transition-colors active:animate-pop ${level === l.id ? "border-primary bg-primary/8" : "border-border bg-surface"
                  }`}
              >
                <p className="font-display text-lg">{l.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{l.blurb}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-10 flex items-center gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          size="lg"
          className="flex-1"
          onClick={() => (step === 3 ? finish() : setStep((s) => s + 1))}
        >
          {step === 3 ? "Build my first session" : "Continue"}
        </Button>
      </div>
    </Screen>
  );
}
