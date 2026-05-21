"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import LoginButton from "@/components/LoginButton";
import GradesTable from "@/components/GradesTable";
import DueTomorrowList from "@/components/DueTomorrowList";
import AssignmentAssistant from "@/components/AssignmentAssistant";
import type { DashboardData } from "@/lib/canvas/types";

type LoadState =
  | "loading"
  | "unauthenticated"
  | "needs_canvas"
  | "error"
  | "ready";

export default function HomePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oauthEnabled, setOauthEnabled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setState("loading");
    setErrorMessage(null);

    const meRes = await fetch("/api/auth/me");
    if (meRes.status === 401) {
      setState("unauthenticated");
      setData(null);
      return;
    }

    const me = await meRes.json();
    setUserEmail(me.user?.email ?? null);

    if (!me.hasCanvasCredentials) {
      setState("needs_canvas");
      setData(null);
      return;
    }

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    try {
      const res = await fetch("/api/dashboard", {
        headers: { "X-Timezone": timezone },
      });

      if (res.status === 401) {
        setState("needs_canvas");
        setData(null);
        setErrorMessage(
          "Your Canvas token may have expired. Update it in Settings."
        );
        return;
      }

      const body = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMessage(body.message ?? "Failed to load dashboard");
        return;
      }

      setData(body as DashboardData);
      setState("ready");
    } catch {
      setState("error");
      setErrorMessage("Network error. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((c: { oauthEnabled?: boolean }) =>
        setOauthEnabled(!!c.oauthEnabled)
      )
      .catch(() => setOauthEnabled(false));

    loadDashboard();

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setErrorMessage(decodeURIComponent(oauthError));
      window.history.replaceState({}, "", "/");
    }
  }, [loadDashboard]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setData(null);
    setState("unauthenticated");
    window.location.href = "/login";
  }

  if (state === "loading") {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
          <div className="h-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
        </div>
      </main>
    );
  }

  if (state === "unauthenticated") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">CanvasBuddy</h1>
        <p className="mt-3 text-[var(--muted)]">
          See your current grades and what&apos;s due tomorrow across all your
          Canvas courses — using your school account, not an administrator
          login.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          >
            {errorMessage}
          </div>
        )}

        <Link
          href="/login"
          className="mt-10 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          Sign in
        </Link>
      </main>
    );
  }

  if (state === "needs_canvas") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">CanvasBuddy</h1>
        {userEmail && (
          <p className="mt-2 text-sm text-[var(--muted)]">Signed in as {userEmail}</p>
        )}
        <p className="mt-4 text-[var(--muted)]">
          Connect your Canvas account to load grades and assignments.
        </p>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          >
            {errorMessage}
          </div>
        )}

        {oauthEnabled && (
          <div className="mt-8">
            <p className="mb-3 text-sm text-[var(--muted)]">
              Or use school Canvas sign-in if your host configured OAuth:
            </p>
            <LoginButton />
          </div>
        )}

        <Link
          href="/settings"
          className="mt-8 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
        >
          Add Canvas token in Settings
        </Link>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-[var(--muted)] underline"
          >
            Sign out
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CanvasBuddy</h1>
          {data && (
            <p className="text-sm text-[var(--muted)]">Hi, {data.user.name}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </header>

      {state === "error" && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-2 font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="mb-10">
            <AssignmentAssistant />
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold">Current grades</h2>
            <GradesTable grades={data.grades} />
          </section>

          <section>
            <h2 className="mb-1 text-lg font-semibold">Due tomorrow</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Assignments and quizzes due on {data.tomorrowDate} (
              {data.timezone})
            </p>
            <DueTomorrowList
              items={data.dueTomorrow}
              tomorrowDate={data.tomorrowDate}
            />
          </section>
        </>
      )}
    </main>
  );
}
