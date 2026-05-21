"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShellCentered } from "@/components/ui/AppShell";
import Alert from "@/components/ui/Alert";
import OnboardingSteps from "@/components/ui/OnboardingSteps";
import AuthForm from "@/components/AuthForm";

export default function LoginPageContent() {
  const searchParams = useSearchParams();
  const [callbackError, setCallbackError] = useState<string | null>(null);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "auth_callback_failed") {
      setCallbackError("Sign-in link expired or was invalid. Please try again.");
    }
  }, [searchParams]);

  return (
    <AppShellCentered wide>
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Sign in to CanvasBuddy</h1>
        <p className="cb-prose-muted mx-auto mt-3 max-w-md">
          Step 1 of 3 — create an account or sign in, then connect Canvas in
          Settings.
        </p>
      </div>

      <div className="mt-8">
        <OnboardingSteps current={1} />
      </div>

      {callbackError && (
        <Alert className="mt-8">{callbackError}</Alert>
      )}

      <div className="cb-card mt-8 p-6 sm:p-8">
        <AuthForm />
      </div>

      <p className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/" className="font-medium text-[var(--accent)] hover:underline">
          ← Back to home
        </Link>
      </p>
    </AppShellCentered>
  );
}
