"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@/components/ui/Alert";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not send reset email.");
        return;
      }
      setMessage(
        data.message ??
          "If an account exists for that email, we sent a link to reset your password."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <p className="text-sm text-[var(--muted)]">
        Enter your school email and we will send a link to reset your password.
      </p>

      <label className="mt-4 block text-sm font-medium">
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
        {submitting ? "Sending…" : "Send reset link"}
      </button>

      <p className="mt-4 text-center text-sm">
        <Link
          href="/login"
          className="font-medium text-[var(--accent)] hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
