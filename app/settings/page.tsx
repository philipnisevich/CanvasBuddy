import { Suspense } from "react";
import AppShell from "@/components/ui/AppShell";
import SettingsPageContent from "./SettingsPageContent";

function SettingsFallback() {
  return (
    <AppShell subtitle="Loading settings…">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-[var(--border)]" />
        <div className="h-64 rounded-[var(--radius)] bg-[var(--border)]" />
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsFallback />}>
      <SettingsPageContent />
    </Suspense>
  );
}
