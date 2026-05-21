"use client";

import { useState } from "react";

type AuthMode = "signin" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.message ?? "Something went wrong. Please try again.");
        return;
      }

      if (mode === "signup") {
        setMessage(
          "Check your email to confirm your account, then sign in and add your Canvas token in Settings."
        );
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <label className="block text-sm font-medium">
        Email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Password
        <input
          type="password"
          required
          minLength={6}
          autoComplete={
            mode === "signup" ? "new-password" : "current-password"
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {message && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {submitting
          ? "Please wait…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <button
              type="button"
              className="font-medium text-[var(--accent)] underline"
              onClick={() => {
                setMode("signup");
                setError(null);
                setMessage(null);
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="font-medium text-[var(--accent)] underline"
              onClick={() => {
                setMode("signin");
                setError(null);
                setMessage(null);
              }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );
}
