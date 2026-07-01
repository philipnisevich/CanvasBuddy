"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import Alert from "@/components/ui/Alert";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import LoginButton from "@/components/LoginButton";
import LandingPage from "@/components/landing/LandingPage";
import type { AppGateState } from "@/hooks/useAppGate";

// Cold-boot splash. Auth is resolved client-side, so the very first paint is
// always "loading"; showing the full app shell here makes the app nav flash in
// and out before the real view (e.g. the landing page) resolves. A neutral,
// logo-only splash on the app canvas is continuous with both the landing page
// and the signed-in shell, so the boot reads as a calm settle, not a flash.
function BootSplash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <span
        className="inline-flex animate-pulse items-center gap-2.5"
        role="status"
        aria-label="Loading CanvasBuddy"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--on-accent)]"
          aria-hidden
        >
          <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--ink)]">
          CanvasBuddy
        </span>
      </span>
    </div>
  );
}

export function AppGateShell({
  state,
  userEmail,
  userName,
  oauthEnabled,
  errorMessage,
  onLogout,
  children,
  showNav = true,
}: {
  state: AppGateState;
  userEmail: string | null;
  userName: string | null;
  oauthEnabled: boolean;
  errorMessage: string | null;
  onLogout: () => void;
  children: ReactNode;
  showNav?: boolean;
}) {
  const navActions = (
    <>
      <Link href="/settings" className="cb-btn-secondary-nav">
        Settings
      </Link>
      <button type="button" onClick={onLogout} className="cb-btn-secondary-nav">
        Sign out
      </button>
    </>
  );

  if (state === "loading") {
    return <BootSplash />;
  }

  if (state === "unauthenticated") {
    return <LandingPage errorMessage={errorMessage} />;
  }

  if (state === "needs_canvas") {
    return (
      <AppShellCentered wide>
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Almost there</h1>
          {userEmail && (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Signed in as <span className="font-medium">{userEmail}</span>
            </p>
          )}
          <p className="cb-prose-muted mx-auto mt-4 max-w-lg">
            Connect Canvas so we can load your courses, grades, and planner
            items.
          </p>
        </div>
        <div className="mt-10">
          <OnboardingSteps current={2} />
        </div>
        {errorMessage && <Alert className="mt-8">{errorMessage}</Alert>}
        <div className="cb-card mt-10 space-y-6 p-8">
          <Link href="/settings" className="cb-btn-primary mx-auto block w-full max-w-xs">
            Open Settings to connect
          </Link>
          {oauthEnabled && (
            <div className="border-t border-[var(--border)] pt-6 text-center">
              <LoginButton />
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="cb-link mx-auto block cursor-pointer text-sm underline"
          >
            Sign out
          </button>
        </div>
      </AppShellCentered>
    );
  }

  return (
    <AppShell
      showNav={showNav}
      subtitle={userName ? `Welcome back, ${userName}` : undefined}
      actions={navActions}
    >
      {children}
    </AppShell>
  );
}
