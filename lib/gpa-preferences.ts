export type GpaPresetId =
  | "standard_us"
  | "simple_40"
  | "standard_weighted"
  | "strong_weighted"
  | "unweighted_only"
  | "custom";

export interface GpaPreferences {
  preset: GpaPresetId;
  /** When false, A+/A/A- share the same point value per letter band. */
  usePlusMinus: boolean;
  weightHonors: boolean;
  weightApIb: boolean;
  honorsBonus: number;
  apBonus: number;
  maxWeightedGpa: number;
}

export const DEFAULT_GPA_PREFERENCES: GpaPreferences = {
  preset: "standard_weighted",
  usePlusMinus: true,
  weightHonors: true,
  weightApIb: true,
  honorsBonus: 0.5,
  apBonus: 1.0,
  maxWeightedGpa: 5.0,
};

export interface GpaPresetOption {
  id: GpaPresetId;
  label: string;
  description: string;
  preferences: GpaPreferences;
}

export const GPA_PRESET_OPTIONS: GpaPresetOption[] = [
  {
    id: "standard_us",
    label: "Standard 4.0 (unweighted)",
    description:
      "Letter grades with plus/minus (A = 4.0, A- = 3.7). No course-level weighting.",
    preferences: {
      preset: "standard_us",
      usePlusMinus: true,
      weightHonors: false,
      weightApIb: false,
      honorsBonus: 0,
      apBonus: 0,
      maxWeightedGpa: 4.0,
    },
  },
  {
    id: "simple_40",
    label: "Simple 4.0 (no +/-)",
    description:
      "A, A+, and A- all count as 4.0. Common at schools that do not distinguish plus/minus on GPA.",
    preferences: {
      preset: "simple_40",
      usePlusMinus: false,
      weightHonors: false,
      weightApIb: false,
      honorsBonus: 0,
      apBonus: 0,
      maxWeightedGpa: 4.0,
    },
  },
  {
    id: "standard_weighted",
    label: "Weighted 5.0 (typical US)",
    description:
      "Standard 4.0 base with +0.5 for Honors and +1.0 for AP/IB (capped at 5.0).",
    preferences: {
      preset: "standard_weighted",
      usePlusMinus: true,
      weightHonors: true,
      weightApIb: true,
      honorsBonus: 0.5,
      apBonus: 1.0,
      maxWeightedGpa: 5.0,
    },
  },
  {
    id: "strong_weighted",
    label: "Weighted 6.0 (strong boost)",
    description:
      "Plus/minus on a 4.0 base with +1.0 Honors and +2.0 AP/IB (capped at 6.0).",
    preferences: {
      preset: "strong_weighted",
      usePlusMinus: true,
      weightHonors: true,
      weightApIb: true,
      honorsBonus: 1.0,
      apBonus: 2.0,
      maxWeightedGpa: 6.0,
    },
  },
  {
    id: "unweighted_only",
    label: "Unweighted only",
    description:
      "Show a single GPA on a 4.0 scale. Course names still label Honors/AP for reference.",
    preferences: {
      preset: "unweighted_only",
      usePlusMinus: true,
      weightHonors: false,
      weightApIb: false,
      honorsBonus: 0,
      apBonus: 0,
      maxWeightedGpa: 4.0,
    },
  },
  {
    id: "custom",
    label: "Custom",
    description:
      "Tune plus/minus handling and how much Honors and AP/IB courses add.",
    preferences: {
      ...DEFAULT_GPA_PREFERENCES,
      preset: "custom",
    },
  },
];

export function normalizeGpaPreferences(
  input: Partial<GpaPreferences> | null | undefined
): GpaPreferences {
  const base = { ...DEFAULT_GPA_PREFERENCES };

  if (!input || typeof input !== "object") {
    return base;
  }

  const preset = isValidPreset(input.preset) ? input.preset : base.preset;

  const merged: GpaPreferences = {
    preset,
    usePlusMinus:
      typeof input.usePlusMinus === "boolean"
        ? input.usePlusMinus
        : base.usePlusMinus,
    weightHonors:
      typeof input.weightHonors === "boolean"
        ? input.weightHonors
        : base.weightHonors,
    weightApIb:
      typeof input.weightApIb === "boolean"
        ? input.weightApIb
        : base.weightApIb,
    honorsBonus: clampBonus(input.honorsBonus, base.honorsBonus),
    apBonus: clampBonus(input.apBonus, base.apBonus),
    maxWeightedGpa: clampMaxGpa(input.maxWeightedGpa, base.maxWeightedGpa),
  };

  if (preset !== "custom") {
    const option = GPA_PRESET_OPTIONS.find((p) => p.id === preset);
    if (option) {
      return { ...option.preferences, preset };
    }
  }

  return merged;
}

function isValidPreset(value: unknown): value is GpaPresetId {
  return (
    typeof value === "string" &&
    GPA_PRESET_OPTIONS.some((p) => p.id === value)
  );
}

function clampBonus(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(3, Math.max(0, Math.round(n * 10) / 10));
}

function clampMaxGpa(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 4.5) return 4.0;
  if (n <= 5.5) return 5.0;
  return 6.0;
}

export function preferencesFromPreset(preset: GpaPresetId): GpaPreferences {
  const option = GPA_PRESET_OPTIONS.find((p) => p.id === preset);
  if (!option) return { ...DEFAULT_GPA_PREFERENCES };
  return { ...option.preferences };
}

export function showWeightedGpa(prefs: GpaPreferences): boolean {
  return prefs.weightHonors || prefs.weightApIb;
}

export function weightBonusForLevel(
  level: "standard" | "honors" | "ap",
  prefs: GpaPreferences
): number {
  if (level === "honors" && prefs.weightHonors) return prefs.honorsBonus;
  if (level === "ap" && prefs.weightApIb) return prefs.apBonus;
  return 0;
}

export function levelLabel(
  level: "standard" | "honors" | "ap",
  prefs: GpaPreferences
): string {
  const bonus = weightBonusForLevel(level, prefs);
  if (level === "standard") return "Standard";
  if (level === "honors") {
    return bonus > 0 ? `Honors (+${bonus})` : "Honors";
  }
  return bonus > 0 ? `AP / IB (+${bonus})` : "AP / IB";
}
