"use client";

import { useCallback, useEffect, useState } from "react";
import Alert from "@/components/ui/Alert";
import SupabaseSetupBanner from "@/components/SupabaseSetupBanner";
import {
  DEFAULT_GPA_PREFERENCES,
  GPA_PRESET_OPTIONS,
  type GpaPreferences,
  type GpaPresetId,
  preferencesFromPreset,
  showWeightedGpa,
} from "@/lib/gpa-preferences";

export default function GpaPreferencesForm() {
  const [prefs, setPrefs] = useState<GpaPreferences>(DEFAULT_GPA_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbWarning, setDbWarning] = useState<string | null>(null);
  const [dbIssue, setDbIssue] = useState<
    "missing_table" | "permission_denied" | "unknown"
  >("unknown");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/gpa");
      const data = await res.json();
      if (res.status === 503 && data.preferences) {
        setPrefs(data.preferences);
        setDbWarning(data.message ?? "Database not ready — using defaults.");
        setDbIssue(
          data.error === "db_permission" ? "permission_denied" : "missing_table"
        );
        return;
      }
      if (!res.ok) {
        setError(data.message ?? "Could not load GPA settings.");
        return;
      }
      setPrefs(data.preferences ?? DEFAULT_GPA_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function applyPreset(preset: GpaPresetId) {
    if (preset === "custom") {
      setPrefs((p) => ({ ...p, preset: "custom" }));
      return;
    }
    setPrefs(preferencesFromPreset(preset));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings/gpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not save GPA settings.");
        if (res.status === 503) {
          setDbIssue(
            data.error === "db_permission"
              ? "permission_denied"
              : "missing_table"
          );
          setDbWarning(data.message ?? null);
        }
        return;
      }
      setPrefs(data.preferences ?? prefs);
      setSaved(true);
      setDbWarning(null);
    } finally {
      setSaving(false);
    }
  }

  const weighted = showWeightedGpa(prefs);

  if (loading) {
    return (
      <section className="cb-card animate-pulse p-8">
        <div className="h-6 w-48 rounded bg-[var(--border)]" />
        <div className="mt-6 h-40 rounded bg-[var(--border)]" />
      </section>
    );
  }

  return (
    <section className="cb-card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-6 py-4">
        <p className="cb-section-label">Academics</p>
        <h2 className="text-lg font-semibold">GPA & grading</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Match how your school calculates GPA. Changes apply to your dashboard
          estimate immediately after saving.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-8 px-6 py-6">
        {dbWarning && (
          <SupabaseSetupBanner issue={dbIssue} target="gpa" />
        )}
        {error && <Alert variant="error">{error}</Alert>}
        {saved && (
          <p
            className="rounded-[var(--radius)] border border-[var(--success)]/40 bg-[var(--success-soft)] px-4 py-3 text-sm font-medium text-[var(--success)]"
            role="status"
          >
            GPA settings saved.
          </p>
        )}

        <fieldset>
          <legend className="text-sm font-semibold text-[var(--color-text)]">
            School scale preset
          </legend>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pick the option closest to your district, then fine-tune below if
            needed.
          </p>
          <div className="mt-4 space-y-2">
            {GPA_PRESET_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer gap-3 rounded-[var(--radius)] border-2 px-4 py-3 transition-colors duration-200 ${
                  prefs.preset === option.id
                    ? "border-[var(--color-canvas-red)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] hover:border-[var(--border-strong)]"
                }`}
              >
                <input
                  type="radio"
                  name="gpa-preset"
                  className="mt-1"
                  checked={prefs.preset === option.id}
                  onChange={() => applyPreset(option.id)}
                />
                <span>
                  <span className="block text-sm font-semibold">
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4 border-t border-[var(--border)] pt-6">
            <legend className="text-sm font-semibold text-[var(--color-text)]">
              Grade scale details
            </legend>

            <ToggleRow
              label="Use plus/minus on letter grades"
              hint="When off, A, A+, and A- all count as 4.0 (and similarly for B, C, D)."
              checked={prefs.usePlusMinus}
              onChange={(usePlusMinus) =>
                setPrefs((p) => ({ ...p, preset: "custom", usePlusMinus }))
              }
            />

            <ToggleRow
              label="Weight Honors courses"
              hint="Adds a bonus to Honors course GPA points (detected from course title)."
              checked={prefs.weightHonors}
              onChange={(weightHonors) =>
                setPrefs((p) => ({ ...p, preset: "custom", weightHonors }))
              }
            />

            {prefs.weightHonors && (
              <NumberRow
                label="Honors bonus"
                hint="Typical values: 0.5 or 1.0"
                value={prefs.honorsBonus}
                min={0}
                max={3}
                step={0.1}
                onChange={(honorsBonus) =>
                  setPrefs((p) => ({ ...p, preset: "custom", honorsBonus }))
                }
              />
            )}

            <ToggleRow
              label="Weight AP / IB courses"
              hint="Adds a bonus for Advanced Placement or International Baccalaureate courses."
              checked={prefs.weightApIb}
              onChange={(weightApIb) =>
                setPrefs((p) => ({ ...p, preset: "custom", weightApIb }))
              }
            />

            {prefs.weightApIb && (
              <NumberRow
                label="AP / IB bonus"
                hint="Typical values: 1.0 or 2.0"
                value={prefs.apBonus}
                min={0}
                max={3}
                step={0.1}
                onChange={(apBonus) =>
                  setPrefs((p) => ({ ...p, preset: "custom", apBonus }))
                }
              />
            )}

            {weighted && (
              <div>
                <label
                  htmlFor="max-weighted-gpa"
                  className="block text-sm font-semibold"
                >
                  Weighted GPA cap
                </label>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  Maximum value for any single weighted course grade.
                </p>
                <select
                  id="max-weighted-gpa"
                  className="cb-input mt-2 max-w-xs"
                  value={prefs.maxWeightedGpa}
                  onChange={(e) =>
                    setPrefs((p) => ({
                      ...p,
                      preset: "custom",
                      maxWeightedGpa: Number(e.target.value),
                    }))
                  }
                >
                  <option value={5}>5.0 scale</option>
                  <option value={6}>6.0 scale</option>
                </select>
              </div>
            )}
          </fieldset>

        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-6">
          <button
            type="submit"
            disabled={saving}
            className="cb-btn-primary"
          >
            {saving ? "Saving…" : "Save GPA settings"}
          </button>
          <p className="text-xs text-[var(--muted)]">
            {weighted
              ? `Dashboard will show unweighted (4.0) and weighted (up to ${prefs.maxWeightedGpa.toFixed(1)}).`
              : "Dashboard will show unweighted GPA only."}
          </p>
        </div>
      </form>
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs text-[var(--muted)]">{hint}</span>
      </span>
    </label>
  );
}

function NumberRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="ml-7">
      <label htmlFor={`gpa-${label}`} className="block text-sm font-semibold">
        {label}
      </label>
      <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p>
      <input
        id={`gpa-${label}`}
        type="number"
        className="cb-input mt-2 max-w-[8rem]"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
