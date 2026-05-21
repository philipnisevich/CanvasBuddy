"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell, { AppShellCentered } from "@/components/ui/AppShell";
import Alert from "@/components/ui/Alert";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import LoginButton from "@/components/LoginButton";
import GradesTable from "@/components/GradesTable";
import GpaCalculator from "@/components/GpaCalculator";
import DueTomorrowList from "@/components/DueTomorrowList";
import AssignmentAssistant from "@/components/AssignmentAssistant";
import type { DashboardData } from "@/lib/canvas/types";

type LoadState =
  | "loading"
  | "unauthenticated"
  | "needs_canvas"
  | "error"
  | "ready";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[var(--radius)] bg-[var(--border)]" />
        ))}
      </div>
      <div className="h-64 rounded-[var(--radius)] bg-[var(--border)]" />
      <div className="h-48 rounded-[var(--radius)] bg-[var(--border)]" />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="cb-card p-5">
      <p className="cb-section-label">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-text)]">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}

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

  const navActions = (
    <>
      <Link href="/settings" className="cb-btn-secondary-nav">
        Settings
      </Link>
      <button
        type="button"
        onClick={handleLogout}
        className="cb-btn-secondary-nav"
      >
        Sign out
      </button>
    </>
  );

  if (state === "loading") {
    return (
      <AppShell subtitle="Loading your courses…">
        <LoadingSkeleton />
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

        {errorMessage && (
          <Alert className="mt-8">{errorMessage}</Alert>
        )}

        <div className="cb-card mt-10 p-8 text-center">
          <p className="text-sm font-medium">Ready to get started?</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            It takes about two minutes to set up.
          </p>
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

        {errorMessage && (
          <Alert className="mt-8">{errorMessage}</Alert>
        )}

        <div className="cb-card mt-10 space-y-6 p-8">
          <div className="text-center">
            <p className="text-sm font-semibold">Connect your school Canvas</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              You&apos;ll create a personal access token in Canvas and paste it
              in Settings. We never ask for an admin account.
            </p>
          </div>

          <Link href="/settings" className="cb-btn-primary mx-auto block w-full max-w-xs">
            Open Settings to connect
          </Link>

          {oauthEnabled && (
            <div className="border-t border-[var(--border)] pt-6 text-center">
              <p className="text-xs text-[var(--muted)]">
                Or, if your school enabled OAuth:
              </p>
              <div className="mt-3">
                <LoginButton />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="cb-link mx-auto block cursor-pointer text-sm underline"
          >
            Sign out
          </button>
        </div>
      </AppShellCentered>
    );
  }

  const dueCount = data?.dueTomorrow.length ?? 0;
  const courseCount = data?.grades.length ?? 0;

  return (
    <AppShell
      subtitle={data ? `Welcome back, ${data.user.name}` : undefined}
      actions={navActions}
    >
      {state === "error" && (
        <Alert className="mb-8">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-2 font-semibold underline"
          >
            Retry loading dashboard
          </button>
        </Alert>
      )}

      {data && (
        <>
          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Active courses"
              value={courseCount}
              hint="From your Canvas enrollment"
            />
            <StatCard
              label="Due tomorrow"
              value={dueCount}
              hint={data.tomorrowDate}
            />
            <StatCard
              label="Your timezone"
              value={data.timezone.split("/").pop()?.replace(/_/g, " ") ?? data.timezone}
              hint="Used for due-date calculations"
            />
          </div>

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-8">
            <div className="space-y-10 lg:col-span-3">
              <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="cb-section-label">Planner</p>
                    <h2 className="text-xl font-semibold">Due tomorrow</h2>
                    <p className="text-sm text-[var(--muted)]">
                      {data.tomorrowDate} · assignments & quizzes
                    </p>
                  </div>
                </div>
                <DueTomorrowList
                  items={data.dueTomorrow}
                  tomorrowDate={data.tomorrowDate}
                />
              </section>

              <section>
                <div className="mb-4">
                  <p className="cb-section-label">Progress</p>
                  <h2 className="text-xl font-semibold">Grades & GPA</h2>
                </div>
                <div className="space-y-6">
                  <GpaCalculator grades={data.grades} />
                  <GradesTable grades={data.grades} />
                </div>
              </section>
            </div>

            <aside className="lg:col-span-2">
              <div className="lg:sticky lg:top-6">
                <p className="cb-section-label mb-4">Study helper</p>
                <AssignmentAssistant />
              </div>
            </aside>
          </div>
        </>
      )}
    </AppShell>
  );
}
