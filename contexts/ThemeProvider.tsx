"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type AccentName = "ink" | "forest" | "oxblood";
export type ResolvedTheme = "light" | "dark";

const MODE_KEY = "cb-theme-mode";
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

function isMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return prefersDark() ? "dark" : "light";
  return mode;
}

function apply(resolved: ResolvedTheme, accent: AccentName) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.dataset.theme = resolved;
  el.dataset.accent = accent;
}

type ThemeContextValue = {
  mode: ThemeMode;
  accent: AccentName;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialise from what the no-flash script already wrote to <html>, falling
  // back to localStorage, then defaults. This keeps React in sync with the DOM
  // attributes set before hydration, avoiding a flash or mismatch.
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem(MODE_KEY);
    return isMode(stored) ? stored : "system";
  });
  const [accent, setAccentState] = useState<AccentName>(() => {
    if (typeof window === "undefined") return "ink";
    const stored = window.localStorage.getItem(ACCENT_KEY);
    return isAccent(stored) ? stored : "ink";
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolve(mode)
  );

  // Apply + persist whenever mode or accent changes.
  useEffect(() => {
    const next = resolve(mode);
    setResolvedTheme(next);
    apply(next, accent);
    window.localStorage.setItem(MODE_KEY, mode);
    window.localStorage.setItem(ACCENT_KEY, accent);
  }, [mode, accent]);

  // Follow the OS when in system mode.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const next = prefersDark() ? "dark" : "light";
      setResolvedTheme(next);
      apply(next, accent);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode, accent]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const setAccent = useCallback((next: AccentName) => setAccentState(next), []);
  const toggleTheme = useCallback(() => {
    // An explicit toggle leaves "system" behind and pins the opposite of
    // whatever is currently showing.
    setModeState(resolve(mode) === "dark" ? "light" : "dark");
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{ mode, accent, resolvedTheme, setMode, setAccent, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
