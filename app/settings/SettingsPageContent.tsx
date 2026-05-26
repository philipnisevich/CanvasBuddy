"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import CanvasCredentialsForm from "@/components/CanvasCredentialsForm";
import SupabaseSetupBanner from "@/components/SupabaseSetupBanner";
import SettingsShell, {
  type SettingsSection,
} from "@/components/settings/SettingsShell";
import AccountPasswordSection from "@/components/settings/AccountPasswordSection";
import GpaPreferencesForm from "@/components/settings/GpaPreferencesForm";
import { useApp } from "@/contexts/AppProvider";
import { useSettingsCache } from "@/contexts/SettingsCache";

type PageState = "loading" | "unauthenticated" | "ready";

const VALID_SECTIONS: SettingsSection[] = ["canvas", "account", "gpa"];

function parseSection(value: string | null): SettingsSection {
  if (value && VALID_SECTIONS.includes(value as SettingsSection)) {
    return value as SettingsSection;
  }
  return "canvas";
}

export default function SettingsPageContent() {
  const { gate } = useApp();
  const cache = useSettingsCache();
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
  const hydratedFromCacheRef = useRef(false);

  useEffect(() => {
    setSection(parseSection(searchParams.get("tab")));
    setRecoveryMode(searchParams.get("recovery") === "1");
  }, [searchParams]);

  // Hydrate from background cache if available
  useEffect(() => {
    if (hydratedFromCacheRef.current) return;
    if (cache.status === "ready" && cache.data) {
      hydratedFromCacheRef.current = true;
      setEmail(cache.data.email);
      setCanvasBaseUrl(cache.data.canvasBaseUrl);
      setHasCredentials(cache.data.hasCredentials);
      setDbReady(cache.data.dbReady);
      setGpaDbReady(cache.data.gpaDbReady);
      setDbIssue(cache.data.dbIssue);
      setGpaDbIssue(cache.data.gpaDbIssue);
      setState("ready");
    } else if (cache.status === "unauthenticated") {
      hydratedFromCacheRef.current = true;
      setState("unauthenticated");
    }
  }, [cache.status, cache.data]);

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

    let credentialsConnected = false;
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      credentialsConnected = !!settings.hasCredentials;
      setHasCredentials(credentialsConnected);
      setCanvasBaseUrl(settings.canvasBaseUrl ?? "");
    }

    setState("ready");

    if (credentialsConnected) {
      await gate.checkAuth({ silent: true });
    }
  }, [gate.checkAuth]);

  // Only fetch fresh if cache didn't provide data
  useEffect(() => {
    if (cache.status === "ready" || cache.status === "unauthenticated") return;
    if (cache.status === "loading") return;
    loadSettings();
  }, [cache.status, loadSettings]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/settings/canvas", { method: "DELETE" });
      setHasCredentials(false);
      setCanvasBaseUrl("");
      cache.invalidate();
      await gate.checkAuth({ silent: true });
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
          Home
        </Link>
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
      </div>

      {!dbReady && section === "canvas" && (
        <div className="mb-6">
          <SupabaseSetupBanner issue={dbIssue} target="canvas" />
        </div>
      )}

      {!gpaDbReady && section === "gpa" && (
        <div className="mb-6">
          <SupabaseSetupBanner issue={gpaDbIssue} target="gpa" />
        </div>
      )}

      <div className="cb-card overflow-hidden">
        <SettingsShell active={section} onNavigate={navigate}>
          {section === "canvas" && (
            <div>
              <h2 className="text-lg font-semibold">Canvas integration</h2>
              {hasCredentials ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--success)]">
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-[var(--success)]"
                    aria-hidden
                  />
                  Connected{canvasBaseUrl ? ` to ${canvasBaseUrl}` : ""}
                </p>
              ) : (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Add your Canvas URL and token to unlock your dashboard.
                </p>
              )}

              <div className="mt-6">
                <CanvasCredentialsForm
                  initialCanvasBaseUrl={canvasBaseUrl}
                  onSuccess={async () => {
                    setHasCredentials(true);
                    cache.invalidate();
                    await loadSettings();
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
            </div>
          )}

          {section === "account" && (
            <div>
              <h2 className="text-lg font-semibold">Account</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Manage your profile, password, and session.
              </p>

              <div className="mt-6 space-y-6">
                <dl className="grid gap-4 sm:grid-cols-[8rem_1fr]">
                  <dt className="text-sm font-semibold text-[var(--muted)]">
                    Email
                  </dt>
                  <dd className="text-sm font-medium">{email ?? "—"}</dd>
                </dl>

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
            </div>
          )}

          {section === "gpa" && <GpaPreferencesForm />}
        </SettingsShell>
      </div>
    </AppShell>
  );
}
