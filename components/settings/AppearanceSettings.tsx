"use client";

import { Check } from "lucide-react";
import { ACCENTS, useTheme } from "@/contexts/ThemeProvider";

export default function AppearanceSettings() {
  const { accent, setAccent } = useTheme();

  return (
    <section className="cb-card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-6 py-4">
        <p className="cb-section-label">Appearance</p>
        <h2 className="text-lg font-semibold">Accent color</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Choose the accent that runs through your dashboard. Saved to this
          browser.
        </p>
      </div>

      <div className="px-6 py-6">
        {/* Accent color */}
        <fieldset>
          <legend className="text-sm font-semibold text-[var(--color-text)]">
            Accent color
          </legend>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The signature color for actions, links, and the current selection.
          </p>
          <div
            className="mt-3 grid gap-2 sm:max-w-md sm:grid-cols-3"
            role="radiogroup"
            aria-label="Accent color"
          >
            {ACCENTS.map((option) => {
              const active = accent === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setAccent(option.id)}
                  title={option.description}
                  className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius)] border px-3 py-2.5 text-left transition-colors duration-200 ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                      : "border-[var(--border-strong)] bg-[var(--card)] hover:bg-[var(--card-muted)]"
                  }`}
                >
                  <span
                    className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: option.swatch }}
                    aria-hidden
                  >
                    {active && (
                      <Check
                        className="h-3.5 w-3.5 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
