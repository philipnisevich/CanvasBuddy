"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import Alert from "@/components/ui/Alert";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import LoginButton from "@/components/LoginButton";
import type { AppGateState } from "@/hooks/useAppGate";

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-10 w-48 rounded-[var(--radius)] bg-[var(--border)]" />
      <div className="h-64 rounded-[var(--radius)] bg-[var(--border)]" />
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
    return (
      <AppShell
        showNav={showNav}
        subtitle="Loading your courses…"
        actions={navActions}
      >
        <PageSkeleton />
      </AppShell>
    );
  }

  if (state === "unauthenticated") {
    return (
      <AppShellCentered wide>
        <div className="text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Your Canvas week at a glance
          </h1>
          <p className="cb-prose-muted mx-auto mt-4 max-w-xl">
            See current grades, what&apos;s due tomorrow, and get study help —
            all from your normal student Canvas account.
          </p>
        </div>
        <div className="mt-10">
          <OnboardingSteps current={1} />
        </div>
        {errorMessage && <Alert className="mt-8">{errorMessage}</Alert>}
        <div className="cb-card mt-10 p-8 text-center">
          <Link href="/login" className="cb-btn-primary mt-6 px-8 py-3">
            Sign in or create account
          </Link>
        </div>
      </AppShellCentered>
    );
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
