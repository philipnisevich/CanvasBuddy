import { Check } from "lucide-react";

const STEPS = [
  { id: 1, title: "Create account", description: "Sign in with your email" },
  { id: 2, title: "Connect Canvas", description: "Add your school token" },
  { id: 3, title: "Study smarter", description: "Grades, due dates & help" },
] as const;

export type OnboardingStep = 1 | 2 | 3;

export default function OnboardingSteps({
  current,
}: {
  current: OnboardingStep;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {STEPS.map((step) => {
        const done = step.id < current;
        const active = step.id === current;

        return (
          <li
            key={step.id}
            className={`cb-card flex gap-3 p-4 transition-[box-shadow,border-color] duration-200 ${
              active ? "border-[var(--color-canvas-red)]" : ""
            }`}
          >
            <span
              className={`cb-step-badge ${
                done
                  ? "cb-step-badge--done"
                  : active
                    ? "cb-step-badge--active"
                    : "cb-step-badge--pending"
              }`}
              aria-hidden
            >
              {done ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
            </span>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold text-[var(--color-text)]">
                {step.title}
              </p>
              <p className="text-xs font-medium text-[var(--color-text-muted)]">
                {step.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
