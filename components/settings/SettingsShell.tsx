"use client";

import { Calculator, Link2, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SettingsSection = "canvas" | "account" | "gpa";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "canvas",
    label: "Canvas integration",
    description: "School URL and access token",
    icon: Link2,
  },
  {
    id: "account",
    label: "Account",
    description: "Password, sign-in, and session",
    icon: User,
  },
  {
    id: "gpa",
    label: "GPA & grading",
    description: "Scale and course weighting",
    icon: Calculator,
  },
];

export default function SettingsShell({
  active,
  onNavigate,
  children,
}: {
  active: SettingsSection;
  onNavigate: (section: SettingsSection) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <nav
        className="cb-card shrink-0 overflow-hidden lg:w-64"
        aria-label="Settings sections"
      >
        <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-4 py-3">
          <p className="cb-section-label">Settings</p>
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Choose a section
          </p>
        </div>
        <ul className="p-2" role="list">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`cb-settings-nav-item flex w-full cursor-pointer items-start gap-3 rounded-[var(--radius)] px-3 py-3 text-left transition-colors duration-200 ${
                    isActive
                      ? "cb-settings-nav-item--active"
                      : "hover:bg-[var(--card-muted)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] border-2 ${
                      isActive
                        ? "border-[var(--color-canvas-red-dark)] bg-[var(--color-canvas-red)] text-white"
                        : "border-[var(--border)] bg-[var(--card)] text-[var(--color-text-muted)]"
                    }`}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--color-text)]">
                      {section.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {section.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
