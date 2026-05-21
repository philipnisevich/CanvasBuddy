"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
      <main className="mx-auto max-w-lg px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-48 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </main>
    );
  }

  if (state === "unauthenticated") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-3 text-[var(--muted)]">Sign in to manage your Canvas connection.</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          {email && (
            <p className="text-sm text-[var(--muted)]">Signed in as {email}</p>
          )}
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-[var(--accent)] underline"
        >
          Back to dashboard
        </Link>
      </header>

      {!dbReady && <SupabaseSetupBanner issue={dbIssue} />}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-5">
        <h2 className="text-lg font-semibold">Canvas connection</h2>
        {hasCredentials ? (
          <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
            Connected{canvasBaseUrl ? ` to ${canvasBaseUrl}` : ""}. Paste a new
            token below to update.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Add your school Canvas URL and personal access token to load your
            dashboard.
          </p>
        )}

        <div className="mt-4">
          <CanvasCredentialsForm
            initialCanvasBaseUrl={canvasBaseUrl}
            onSuccess={() => {
              setHasCredentials(true);
              loadSettings();
            }}
          />
        </div>

        {hasCredentials && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="mt-6 text-sm font-medium text-red-600 underline disabled:opacity-60 dark:text-red-400"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect Canvas"}
          </button>
        )}
      </section>

      <section className="mt-8 rounded-xl border border-[var(--border)] px-5 py-5">
        <h2 className="text-lg font-semibold">Account</h2>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
      </section>
    </main>
  );
}
