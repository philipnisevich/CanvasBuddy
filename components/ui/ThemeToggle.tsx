"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeProvider";

/**
 * Nav theme toggle. Flips between light and dark (pinning an explicit choice).
 * Finer control — including "System" — lives in Settings → Appearance.
 */
export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  // Avoid a hydration mismatch: the server can't know the stored theme, so
  // render the stable (light) icon until mounted, then correct.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius)] border border-white/20 bg-white/5 text-[var(--color-nav-text)] transition-colors duration-200 hover:border-white/40 hover:bg-white/15"
    >
      {isDark ? (
        <Sun className="h-4 w-4" strokeWidth={2.25} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2.25} />
      )}
    </button>
  );
}
