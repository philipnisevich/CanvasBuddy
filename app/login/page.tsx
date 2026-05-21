import { Suspense } from "react";
import { AppShellCentered } from "@/components/ui/AppShell";
import LoginPageContent from "./LoginPageContent";

function LoginFallback() {
  return (
    <AppShellCentered wide>
      <div className="animate-pulse space-y-6">
        <div className="mx-auto h-10 w-64 rounded bg-[var(--border)]" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-[var(--radius)] bg-[var(--border)]" />
          ))}
        </div>
        <div className="h-72 rounded-[var(--radius)] bg-[var(--border)]" />
      </div>
    </AppShellCentered>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
