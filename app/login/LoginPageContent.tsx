"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">CanvasBuddy</h1>
        <p className="mt-3 text-[var(--muted)]">
          Sign in to see your grades, due dates, and assignment assistant.
        </p>
      </div>

      {callbackError && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {callbackError}
        </div>
      )}

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-5">
        <AuthForm />
      </div>
    </main>
  );
}
