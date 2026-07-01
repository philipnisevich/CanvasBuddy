"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AccentName = "ink" | "forest" | "oxblood";

const ACCENT_KEY = "cb-accent";

export const ACCENTS: {
  id: AccentName;
  label: string;
  description: string;
  /** Swatch shown in the picker (light-mode accent value). */
  swatch: string;
}[] = [
  {
    id: "ink",
    label: "Ink Blue",
    description: "Fountain-pen ink — the default ledger voice.",
    swatch: "oklch(0.50 0.15 264)",
  },
  {
    id: "forest",
    label: "Forest Green",
    description: "Examination green — calm and scholarly.",
    swatch: "oklch(0.48 0.10 155)",
  },
  {
    id: "oxblood",
    label: "Oxblood",
    description: "Leather-bound burgundy — warm and traditional.",
    swatch: "oklch(0.45 0.14 18)",
  },
];

const ACCENT_IDS = ACCENTS.map((a) => a.id);

function isAccent(value: string | null): value is AccentName {
  return value !== null && (ACCENT_IDS as string[]).includes(value);
}

function apply(accent: AccentName) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  // The app is light-only; the theme attribute stays fixed and just the
  // selectable accent varies.
  el.dataset.theme = "light";
  el.dataset.accent = accent;
}

type ThemeContextValue = {
  accent: AccentName;
  setAccent: (accent: AccentName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentName>(() => {
    if (typeof window === "undefined") return "ink";
    const stored = window.localStorage.getItem(ACCENT_KEY);
    return isAccent(stored) ? stored : "ink";
  });

  // Apply + persist whenever the accent changes.
  useEffect(() => {
    apply(accent);
    window.localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  const setAccent = useCallback((next: AccentName) => setAccentState(next), []);

  return (
    <ThemeContext.Provider value={{ accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
