"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@/components/ui/Alert";

type AuthMode = "signin" | "signup";

export default function AuthForm({
  initialMode = "signin",
}: {
  initialMode?: AuthMode;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    if (mode === "signup" && !agreed) {
      setError(
        "Please confirm you are at least 13 and agree to the Terms and Privacy Policy."
      );
      return;
    }

    setSubmitting(true);

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/signin";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup"
            ? { email, password, confirmPassword }
            : { email, password }
        ),
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
      <div className="cb-segment mb-6" role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={`cb-segment-btn ${mode === "signin" ? "cb-segment-btn--active" : ""}`}
          onClick={() => {
            setMode("signin");
            setConfirmPassword("");
            setAgreed(false);
            setError(null);
            setMessage(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={`cb-segment-btn ${mode === "signup" ? "cb-segment-btn--active" : ""}`}
          onClick={() => {
            setMode("signup");
            setConfirmPassword("");
            setAgreed(false);
            setError(null);
            setMessage(null);
          }}
        >
          Create account
        </button>
      </div>

      <label className="block text-sm font-medium">
        School email
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="cb-input mt-1.5"
          placeholder="you@school.edu"
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
          className="cb-input mt-1.5"
          placeholder={mode === "signup" ? "At least 6 characters" : ""}
        />
      </label>

      {mode === "signup" && (
        <label className="mt-4 block text-sm font-medium">
          Confirm password
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="cb-input mt-1.5"
            placeholder="Re-enter your password"
          />
        </label>
      )}

      {mode === "signup" && (
        <label className="mt-4 flex items-start gap-2.5 text-sm text-[var(--muted-ink)]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
          />
          <span>
            I am at least 13 years old and agree to the{" "}
            <Link href="/terms" target="_blank" className="cb-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="cb-link">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      )}

      {error && <Alert className="mt-4">{error}</Alert>}

      {message && (
        <Alert variant="success" className="mt-4">
          {message}
        </Alert>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="cb-btn-primary mt-6 w-full py-3"
      >
        {submitting
          ? "Please wait…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      {mode === "signin" && (
        <>
          <p className="mt-3 text-center text-sm">
            <Link href="/login?forgot=1" className="cb-link">
              Forgot password?
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            After signing in, connect Canvas in Settings to load your courses.
          </p>
        </>
      )}
    </form>
  );
}
