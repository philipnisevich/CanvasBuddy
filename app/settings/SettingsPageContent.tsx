"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import CanvasCredentialsForm from "@/components/CanvasCredentialsForm";
import SupabaseSetupBanner from "@/components/SupabaseSetupBanner";
import SettingsShell, {
  type SettingsSection,
} from "@/components/settings/SettingsShell";
import AccountPasswordSection from "@/components/settings/AccountPasswordSection";
import GpaPreferencesForm from "@/components/settings/GpaPreferencesForm";

type PageState = "loading" | "unauthenticated" | "ready";

const VALID_SECTIONS: SettingsSection[] = ["canvas", "account", "gpa"];

function parseSection(value: string | null): SettingsSection {
  if (value && VALID_SECTIONS.includes(value as SettingsSection)) {
    return value as SettingsSection;
  }
  return "canvas";
}

export default function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PageState>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("");
  const [hasCredentials, setHasCredentials] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [dbReady, setDbReady] = useState(true);
  const [gpaDbReady, setGpaDbReady] = useState(true);
  const [dbIssue, setDbIssue] = useState<
    "missing_table" | "permission_denied" | "unknown"
  >("unknown");
  const [gpaDbIssue, setGpaDbIssue] = useState<
    "missing_table" | "permission_denied" | "unknown"
  >("unknown");
  const [section, setSection] = useState<SettingsSection>(() =>
    parseSection(searchParams.get("tab"))
  );
  const [recoveryMode, setRecoveryMode] = useState(
    () => searchParams.get("recovery") === "1"
  );

  useEffect(() => {
    setSection(parseSection(searchParams.get("tab")));
    setRecoveryMode(searchParams.get("recovery") === "1");
  }, [searchParams]);

  function clearRecoveryParam() {
    setRecoveryMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("recovery");
    window.history.replaceState(null, "", url.toString());
  }

  function navigate(section: SettingsSection) {
    setSection(section);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", section);
    window.history.replaceState(null, "", url.toString());
  }

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
      setGpaDbReady(db.gpaReady !== false);
      if (db.issue === "missing_table" || db.issue === "permission_denied") {
        setDbIssue(db.issue);
      }
      if (
        db.gpaIssue === "missing_table" ||
        db.gpaIssue === "permission_denied"
      ) {
        setGpaDbIssue(db.gpaIssue);
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
            Sign in to manage your Canvas connection and GPA preferences.
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Connect Canvas, manage your account, and align GPA calculations with
          your school.
        </p>
      </div>

      {!dbReady && section === "canvas" && (
        <div className="mb-8">
          <SupabaseSetupBanner issue={dbIssue} target="canvas" />
        </div>
      )}

      {!gpaDbReady && section === "gpa" && (
        <div className="mb-8">
          <SupabaseSetupBanner issue={gpaDbIssue} target="gpa" />
        </div>
      )}

      <SettingsShell active={section} onNavigate={navigate}>
        {section === "canvas" && (
          <>
            <OnboardingSteps current={hasCredentials ? 3 : 2} />
            <section className="cb-card mt-6 overflow-hidden">
              <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-6 py-4">
                <p className="cb-section-label">Integration</p>
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
                  <div className="cb-settings-section-head mt-6 border-t border-[var(--border)] pt-6">
                    <p className="min-w-0 flex-1 text-sm text-[var(--muted)]">
                      Open your dashboard or disconnect Canvas from this account.
                    </p>
                    <div className="cb-settings-actions shrink-0">
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="cb-btn-secondary cursor-pointer !text-[var(--danger)] disabled:opacity-60"
                      >
                        {disconnecting ? "Disconnecting…" : "Disconnect Canvas"}
                      </button>
                      <Link href="/" className="cb-btn-primary text-sm">
                        Go to dashboard
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {section === "account" && (
          <section className="cb-card overflow-hidden">
            <div className="border-b border-[var(--border)] bg-[var(--card-muted)] px-6 py-4">
              <p className="cb-section-label">Account</p>
              <h2 className="text-lg font-semibold">Your profile</h2>
            </div>
            <div className="space-y-6 px-6 py-6">
              <dl className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                <dt className="text-sm font-semibold text-[var(--muted)]">
                  Email
                </dt>
                <dd className="text-sm font-medium">{email ?? "—"}</dd>
              </dl>
              <p className="text-sm text-[var(--muted)]">
                CanvasBuddy uses Supabase for sign-in. Your Canvas token is
                stored separately and never shared with other users.
              </p>

              {email && (
                <AccountPasswordSection
                  email={email}
                  recoveryMode={recoveryMode}
                  onRecoveryComplete={clearRecoveryParam}
                />
              )}

              <div className="border-t border-[var(--border)] pt-6">
                <div className="cb-settings-section-head">
                  <div>
                    <h3 className="text-sm font-semibold">Session</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Sign out on this device. You can sign back in anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="cb-btn-secondary shrink-0"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {section === "gpa" && <GpaPreferencesForm />}
      </SettingsShell>
    </AppShell>
  );
}
