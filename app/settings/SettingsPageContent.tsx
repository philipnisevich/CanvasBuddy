"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import PageToolbar from "@/components/ui/PageToolbar";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import CanvasCredentialsForm from "@/components/CanvasCredentialsForm";
import SupabaseSetupBanner from "@/components/SupabaseSetupBanner";
import Alert from "@/components/ui/Alert";
import SettingsShell, {
  type SettingsSection,
} from "@/components/settings/SettingsShell";
import AccountPasswordSection from "@/components/settings/AccountPasswordSection";
import GpaPreferencesForm from "@/components/settings/GpaPreferencesForm";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import { useApp } from "@/contexts/AppProvider";

const VALID_SECTIONS: SettingsSection[] = [
  "canvas",
  "account",
  "gpa",
  "appearance",
];

function parseSection(value: string | null): SettingsSection {
  if (value && VALID_SECTIONS.includes(value as SettingsSection)) {
    return value as SettingsSection;
  }
  return "canvas";
}

// Read the URL synchronously so the first render already has the right tab.
// window is undefined during SSR — the client's lazy initializer corrects it
// before any tab UI paints (that UI is gated behind the loading skeleton).
function initialSection(): SettingsSection {
  if (typeof window === "undefined") return "canvas";
  return parseSection(new URLSearchParams(window.location.search).get("tab"));
}

function initialRecoveryMode(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("recovery") === "1";
}

export default function SettingsPageContent() {
  const { gate, settings, settingsStatus, refreshSettings } = useApp();
  const email = gate.userEmail;
  const [disconnecting, setDisconnecting] = useState(false);
  // Tab + recovery flag come from the URL (e.g. password-reset emails land at
  // /settings?recovery=1). Read them in the lazy initializer so the first
  // render already shows the right tab — no post-mount flash of the default.
  const [section, setSection] = useState<SettingsSection>(initialSection);
  const [recoveryMode, setRecoveryMode] = useState(initialRecoveryMode);

  function clearRecoveryParam() {
    setRecoveryMode(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("recovery");
    window.history.replaceState(null, "", url.toString());
  }

  function navigate(next: SettingsSection) {
    setSection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/settings/canvas", { method: "DELETE" });
      await refreshSettings();
      await gate.checkAuth({ silent: true });
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleLogout() {
    await gate.handleLogout();
  }

  // Hold the skeleton until the preloaded settings (Canvas connection + DB
  // readiness) have resolved. Rendering earlier would flash the "not connected"
  // state from DEFAULT_SETTINGS_DATA even for a connected user.
  const settingsLoading =
    settingsStatus === "idle" || settingsStatus === "loading";
  const gateResolved =
    gate.state === "ready" || gate.state === "needs_canvas";

  if (gate.state === "loading" || (gateResolved && settingsLoading)) {
    return (
      <AppShell
        showNav
        subtitle="Loading settings…"
        actions={
          <button
            type="button"
            onClick={handleLogout}
            className="cb-btn-secondary-nav"
          >
            Sign out
          </button>
        }
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--border)]" />
          <div className="h-64 rounded-[var(--radius)] bg-[var(--border)]" />
        </div>
      </AppShell>
    );
  }

  if (gate.state === "unauthenticated") {
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

  const { hasCredentials, canvasBaseUrl, dbReady, gpaDbReady, dbIssue, gpaIssue } =
    settings;

  return (
    <AppShell
      showNav
      subtitle={email ? `Signed in as ${email}` : undefined}
      actions={
        <button
          type="button"
          onClick={handleLogout}
          className="cb-btn-secondary-nav"
        >
          Sign out
        </button>
      }
    >
      <PageToolbar
        title="Settings"
        description="Connect Canvas, manage your account, choose your theme, and align GPA calculations with your school."
      />

      {!dbReady && section === "canvas" && (
        <div className="mb-8">
          <SupabaseSetupBanner issue={dbIssue} target="canvas" />
        </div>
      )}

      {!gpaDbReady && section === "gpa" && (
        <div className="mb-8">
          <SupabaseSetupBanner issue={gpaIssue} target="gpa" />
        </div>
      )}

      <SettingsShell active={section} onNavigate={navigate}>
        {section === "canvas" && settingsStatus === "error" && (
          // The connection status couldn't load. Show an honest, retryable
          // notice instead of the default "not connected" state, which would
          // wrongly imply a connected user's Canvas link was lost.
          <div className="mt-6">
            <Alert variant="warning">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  We couldn&apos;t load your Canvas connection status right now.
                  Your connection hasn&apos;t changed — this is just a display
                  problem.
                </span>
                <button
                  type="button"
                  onClick={() => void refreshSettings()}
                  className="cb-btn-ghost shrink-0 text-sm"
                >
                  Try again
                </button>
              </div>
            </Alert>
          </div>
        )}
        {section === "canvas" && settingsStatus !== "error" && (
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
                  onSuccess={async () => {
                    await refreshSettings();
                    await gate.checkAuth({ silent: true });
                  }}
                />

                {hasCredentials && (
                  <div className="cb-settings-section-head mt-6 border-t border-[var(--border)] pt-6">
                    <p className="min-w-0 flex-1 text-sm text-[var(--muted)]">
                      Open your dashboard or disconnect Canvas from this account.
                    </p>
                    <div className="cb-settings-actions shrink-0">
                      <Link href="/" className="cb-btn-primary text-sm">
                        Go to dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="cb-btn-danger"
                      >
                        {disconnecting ? "Disconnecting…" : "Disconnect Canvas"}
                      </button>
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

        {section === "appearance" && <AppearanceSettings />}
      </SettingsShell>
    </AppShell>
  );
}
