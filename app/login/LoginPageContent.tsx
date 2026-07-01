"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, GraduationCap, ShieldCheck } from "lucide-react";
import Alert from "@/components/ui/Alert";
import LedgerPreview from "@/components/landing/LedgerPreview";
import AuthForm from "@/components/AuthForm";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

const STEPS = [
  "Create your account with a school email",
  "Connect Canvas — read-only, your student account",
  "See grades, deadlines, and study help",
];

export default function LoginPageContent() {
  const searchParams = useSearchParams();
  const forgotMode = searchParams.get("forgot") === "1";
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_callback_failed") {
      setCallbackError("Sign-in link expired or was invalid. Please try again.");
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <a href="#main-content" className="cb-skip-link">
        Skip to main content
      </a>

      <header className="border-b border-[var(--hairline)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="group inline-flex cursor-pointer items-center gap-2.5"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--on-accent)]"
              aria-hidden
            >
              <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--ink)]">
              CanvasBuddy
            </span>
          </Link>
          <Link href="/" className="cb-btn-ghost hidden sm:inline-flex">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Home
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto grid min-h-[calc(100vh-3.75rem)] max-w-6xl items-stretch gap-0 px-0 lg:grid-cols-2"
      >
        {/* Brand panel */}
        <section className="hidden flex-col justify-center border-r border-[var(--hairline)] bg-[var(--surface-2)] px-6 py-16 lg:flex xl:px-16">
          <div className="mx-auto w-full max-w-md">
            <p className="cb-section-label">Welcome back</p>
            <h1 className="mt-4 font-[family-name:var(--font-heading)] text-3xl font-bold leading-tight text-[var(--ink)] xl:text-4xl">
              Where you stand, at a glance.
            </h1>
            <p className="mt-4 leading-relaxed text-[var(--muted-ink)]">
              Sign in to pick up your live grades, upcoming deadlines, and the
              study assistant scoped to your courses.
            </p>

            <div className="mt-8">
              <LedgerPreview compact />
            </div>

            <ol className="mt-8 space-y-3">
              {STEPS.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 text-sm text-[var(--muted-ink)]"
                >
                  <span className="cb-step-num cb-metric h-7 w-7 text-xs">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <p className="mt-8 inline-flex items-start gap-2 text-sm text-[var(--muted-ink)]">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent-ink)]"
                aria-hidden
              />
              <span>Your Canvas token never leaves our server.</span>
            </p>
          </div>
        </section>

        {/* Auth panel */}
        <section className="flex flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <p className="cb-section-label">Step 1 of 3</p>
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-[var(--ink)] sm:text-[1.75rem]">
              {forgotMode ? "Reset your password" : "Sign in to CanvasBuddy"}
            </h2>
            <p className="mt-2 text-sm text-[var(--muted-ink)]">
              {forgotMode
                ? "We'll email you a link to set a new password."
                : "Create an account or sign in, then connect Canvas in Settings."}
            </p>

            {callbackError && <Alert className="mt-6">{callbackError}</Alert>}

            <div className="cb-card mt-6 p-6 sm:p-7">
              {forgotMode ? <ForgotPasswordForm /> : <AuthForm />}
            </div>

            <p className="mt-6 text-center text-sm text-[var(--muted-ink)] lg:hidden">
              <Link href="/" className="cb-link">
                ← Back to home
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
