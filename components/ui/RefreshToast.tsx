"use client";

import { Loader2 } from "lucide-react";

// A small overlay toast shown while Canvas data is being re-fetched. Kept as a
// true overlay (fixed, above the app) so refreshing gives clear feedback without
// tearing down or blanking the current page.
export default function RefreshToast({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5"
        style={{ boxShadow: "var(--shadow-overlay)" }}
      >
        <Loader2
          className="h-4 w-4 animate-spin text-[var(--accent)]"
          aria-hidden
        />
        <span className="text-sm font-medium text-[var(--ink)]">
          Refreshing your courses…
        </span>
      </div>
    </div>
  );
}
