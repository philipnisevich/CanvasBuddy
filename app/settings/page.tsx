"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import CanvasCredentialsForm from "@/components/CanvasCredentialsForm";
import SupabaseSetupBanner from "@/components/SupabaseSetupBanner";

type PageState = "loading" | "unauthenticated" | "ready";

export default function SettingsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [dbReady, setDbReady] = useState(true);
  const [dbIssue, setDbIssue] = useState<
    "missing_table" | "permission_denied" | "unknown"
  >("unknown");

  const loadSettings = useCallback(async () => {
    setState("loading");
    const meRes = await fetch("/api/auth/me");
    if (meRes.status === 401) {
      setState("unauthenticated");
      return;
    }

    const me = await meRes.json();
    setEmail(me.user?.email ?? null);

    const [settingsRes, dbRes] = await Promise.all([
      fetch("/api/settings/canvas"),
      fetch("/api/settings/db-status"),
    ]);

    if (dbRes.ok) {
      const db = await dbRes.json();
      setDbReady(!!db.ready);
      if (db.issue === "missing_table" || db.issue === "permission_denied") {
        setDbIssue(db.issue);
      }
    }

    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      setHasCredentials(!!settings.hasCredentials);
      setCanvasBaseUrl(settings.canvasBaseUrl ?? "");
    }

    setState("ready");
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/settings/canvas", { method: "DELETE" });
      setHasCredentials(false);
      setCanvasBaseUrl("");
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (state === "loading") {
    return (
      <AppShell subtitle="Loading settings…">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--border)]" />
          <div className="h-64 rounded-[var(--radius)] bg-[var(--border)]" />
        </div>
      </AppShell>
    );
  }

  if (state === "unauthenticated") {
    return (
      <AppShellCentered>
        <div className="cb-card p-8 text-center">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="cb-prose-muted mt-3">
            Sign in to manage your Canvas connection.
          </p>
          <Link href="/login" className="cb-btn-primary mt-6">
            Sign in
          </Link>
        </div>
      </AppShellCentered>
    );
  }

  return (
    <AppShell
      subtitle={email ? `Signed in as ${email}` : undefined}
      actions={
        <Link href="/" className="cb-btn-secondary-nav">
          Dashboard
        </Link>
      }
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Step 2 — connect your school Canvas with a personal access token.
          </p>
        </div>

        <OnboardingSteps current={hasCredentials ? 3 : 2} />

        {!dbReady && (
          <div className="mt-8">
            <SupabaseSetupBanner issue={dbIssue} />
          </div>
        )}

        <section className="cb-card mt-8 overflow-hidden">
          <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-6 py-4">
            <p className="cb-section-label">Connection</p>
            <h2 className="text-lg font-semibold">Canvas</h2>
            {hasCredentials ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--success)]">
                <span
                  className="inline-block h-2 w-2 rounded-full bg-[var(--success)]"
                  aria-hidden
                />
                Connected{canvasBaseUrl ? ` to ${canvasBaseUrl}` : ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Add your Canvas URL and token to unlock your dashboard.
              </p>
            )}
          </div>

          <div className="px-6 py-6">
            <CanvasCredentialsForm
              initialCanvasBaseUrl={canvasBaseUrl}
              onSuccess={() => {
                setHasCredentials(true);
                loadSettings();
              }}
            />

            {hasCredentials && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6">
                <Link href="/" className="cb-btn-primary text-sm">
                  Go to dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-sm font-medium text-[var(--danger)] underline disabled:opacity-60"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect Canvas"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="cb-card mt-6 px-6 py-5">
          <p className="cb-section-label">Account</p>
          <h2 className="text-lg font-semibold">Session</h2>
          <button
            type="button"
            onClick={handleLogout}
            className="cb-btn-secondary mt-4"
          >
            Sign out
          </button>
        </section>
      </div>
    </AppShell>
  );
}
