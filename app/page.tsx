"use client";

import { useCallback, useEffect, useState } from "react";
import LoginButton from "@/components/LoginButton";
import TokenLoginForm from "@/components/TokenLoginForm";
import GradesTable from "@/components/GradesTable";
import DueTomorrowList from "@/components/DueTomorrowList";
import type { DashboardData } from "@/lib/canvas/types";

type LoadState = "loading" | "unauthenticated" | "error" | "ready";

export default function HomePage() {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [oauthEnabled, setOauthEnabled] = useState(false);

  const loadDashboard = useCallback(async () => {
    setState("loading");
    setErrorMessage(null);

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    try {
      const res = await fetch("/api/dashboard", {
        headers: { "X-Timezone": timezone },
      });

      if (res.status === 401) {
        setState("unauthenticated");
        setData(null);
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
      setState("unauthenticated");
      window.history.replaceState({}, "", "/");
    }
  }, [loadDashboard]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setData(null);
    setState("unauthenticated");
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
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">CanvasBuddy</h1>
          <p className="mt-3 text-[var(--muted)]">
            See your current grades and what&apos;s due tomorrow across all your
            Canvas courses — using your school account, not an administrator
            login.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
          >
            {errorMessage}
          </div>
        )}

        {oauthEnabled && (
          <div className="mt-10 text-center">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              Option 1 — School sign-in
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              One click if your school has connected CanvasBuddy.
            </p>
            <div className="mt-4">
              <LoginButton />
            </div>
          </div>
        )}

        <div
          className={`rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-5 ${
            oauthEnabled ? "mt-8" : "mt-10"
          }`}
        >
          <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
            {oauthEnabled ? "Option 2 — " : ""}
            Connect yourself
          </h2>
          <TokenLoginForm onSuccess={loadDashboard} />
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
        <button
          type="button"
          onClick={handleLogout}
          className="self-start rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Log out
        </button>
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
