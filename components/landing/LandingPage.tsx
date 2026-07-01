"use client";

import Link from "next/link";
import {
  GraduationCap,
  Gauge,
  CalendarClock,
  ListChecks,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import Alert from "@/components/ui/Alert";
import LedgerPreview from "@/components/landing/LedgerPreview";

const FEATURES = [
  {
    icon: Gauge,
    title: "See where you stand",
    body: "A current grade in every course and an estimated GPA — computed once and shown identically across the dashboard and the assistant.",
  },
  {
    icon: CalendarClock,
    title: "Know what's next",
    body: "Everything due soon, ordered by what actually matters. A focused read of your week, not a wall of notifications.",
  },
  {
    icon: ListChecks,
    title: "Catch what's missing",
    body: "Missing and late work surfaced plainly, so you can fix it in a minute. Informed, never nagged.",
  },
  {
    icon: Sparkles,
    title: "Ask about your courses",
    body: "An assistant scoped to your schoolwork: “What's my grade if I bomb the final?” “What am I missing in Bio?”",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Create your account",
    body: "Sign up with your school email in a few seconds.",
  },
  {
    n: 2,
    title: "Connect Canvas",
    body: "Paste an access token or sign in with Canvas — read-only, your student account.",
  },
  {
    n: 3,
    title: "Open to the answer",
    body: "Grades, deadlines, missing work, and study help, ready the moment you land.",
  },
];

export default function LandingPage({
  errorMessage,
}: {
  errorMessage?: string | null;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <a href="#main-content" className="cb-skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="inline-flex items-center gap-2.5">
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
          <div className="flex items-center gap-2">
            <Link href="/login" className="cb-btn-ghost hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/login" className="cb-btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-[var(--hairline)]">
          <div
            className="cb-ledger-rule pointer-events-none absolute inset-0"
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
            <div className="cb-rise">
              <p className="cb-section-label">For students on Canvas</p>
              <h1 className="mt-4 font-[family-name:var(--font-heading)] text-4xl font-bold leading-[1.08] tracking-[-0.01em] text-[var(--ink)] sm:text-5xl lg:text-[3.5rem]">
                Know exactly where you stand.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-[var(--muted-ink)]">
                CanvasBuddy reads your live Canvas grades, due dates, and missing
                work, then surfaces the one or two things that actually need your
                attention — calmly, and faster than Canvas can.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="cb-btn-primary px-5 py-2.5 text-[0.9375rem]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  href="/login"
                  className="cb-btn-ghost px-5 py-2.5 text-[0.9375rem]"
                >
                  Sign in
                </Link>
              </div>
              <p className="mt-6 inline-flex items-start gap-2 text-sm text-[var(--muted-ink)]">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent-ink)]"
                  aria-hidden
                />
                <span>
                  Your normal student account. Your Canvas token never leaves our
                  server.
                </span>
              </p>
              {errorMessage && (
                <Alert className="mt-6 max-w-xl">{errorMessage}</Alert>
              )}
            </div>

            <div className="cb-rise lg:pl-4" style={{ animationDelay: "120ms" }}>
              <LedgerPreview />
            </div>
          </div>
        </section>

        {/* Value / features */}
        <section className="border-b border-[var(--hairline)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--ink)] sm:text-[1.75rem]">
                One place that answers &ldquo;where do I stand?&rdquo;
              </h2>
              <p className="mt-3 text-[var(--muted-ink)]">
                Canvas has the data. CanvasBuddy turns it into a read you can act
                on in seconds — without the institutional clutter.
              </p>
            </div>

            <div className="cb-cell-grid mt-10 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="cb-cell cb-cell-interactive">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                    aria-hidden
                  >
                    <f.icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--ink)]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted-ink)]">
                    {f.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — a genuine 3-step sequence */}
        <section className="border-b border-[var(--hairline)] bg-[var(--surface-2)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--ink)] sm:text-[1.75rem]">
              From zero to your first read in under a minute.
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {STEPS.map((s, i) => (
                <li key={s.n} className="relative">
                  {i < STEPS.length - 1 && (
                    <span
                      className="absolute left-9 right-0 top-[1.125rem] hidden h-px bg-[var(--hairline-strong)] sm:block"
                      aria-hidden
                    />
                  )}
                  <div className="relative flex items-center gap-3">
                    <span className="cb-step-num cb-metric text-sm">{s.n}</span>
                    <span className="h-px flex-1 bg-transparent" />
                  </div>
                  <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--ink)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted-ink)]">
                    {s.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust band */}
        <section className="border-b border-[var(--hairline)]">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-12">
              <span
                className="inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                aria-hidden
              >
                <ShieldCheck className="h-7 w-7" strokeWidth={1.9} />
              </span>
              <div className="max-w-2xl">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--ink)] sm:text-[1.75rem]">
                  Trusted with your transcript, built like it.
                </h2>
                <p className="mt-4 leading-relaxed text-[var(--muted-ink)]">
                  These are real grades and deadlines, so CanvasBuddy treats them
                  that way. Every Canvas request happens on the server — your
                  access token never reaches the browser, and never reaches the AI.
                  You connect with a normal student account, not an administrator
                  login, and only the derived numbers are shown back to you.
                </p>
                <p className="mt-4 leading-relaxed text-[var(--muted-ink)]">
                  Grades and GPA are computed once in shared, tested modules, so
                  the figure on your dashboard and the figure the assistant quotes
                  are always the same one.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-24">
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight text-[var(--ink)] sm:text-4xl">
              Open CanvasBuddy instead of Canvas.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--muted-ink)]">
              Sign in and connect Canvas — you&apos;ll see where you stand on the
              next screen.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="cb-btn-primary px-6 py-3 text-[0.9375rem]"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-[var(--muted-ink)] sm:flex-row sm:px-6">
          <span className="inline-flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[var(--accent-ink)]" aria-hidden />
            CanvasBuddy
          </span>
          <span>
            Uses your student Canvas account — not an administrator login.
          </span>
        </div>
      </footer>
    </div>
  );
}
