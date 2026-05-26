"use client";

import { Calculator, Link2, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SettingsSection = "canvas" | "account" | "gpa";

const SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "canvas", label: "Canvas integration", icon: Link2 },
  { id: "account", label: "Account", icon: User },
  { id: "gpa", label: "GPA & grading", icon: Calculator },
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
    <div className="cb-settings-layout">
      <nav className="cb-settings-sidebar" aria-label="Settings sections">
        <ul className="cb-settings-sidebar-list" role="list">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`cb-settings-sidebar-btn${isActive ? " cb-settings-sidebar-btn--active" : ""}`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                  <span>{section.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="cb-settings-content">{children}</div>
    </div>
  );
}
