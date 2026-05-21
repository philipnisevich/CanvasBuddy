"use client";

import { useState } from "react";

interface TokenLoginFormProps {
  onSuccess: () => void;
}

export default function TokenLoginForm({ onSuccess }: TokenLoginFormProps) {
  const [canvasBaseUrl, setCanvasBaseUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasBaseUrl, accessToken }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.message ?? "Could not connect to Canvas.");
        return;
      }

      onSuccess();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 text-left">
      <p className="mb-4 text-sm text-[var(--muted)]">
        No administrator access needed. Use your normal student Canvas login to
        create a token, then paste it here.
      </p>

      <label className="block text-sm font-medium">
        Canvas URL
        <input
          type="url"
          required
          placeholder="https://yourschool.instructure.com"
          value={canvasBaseUrl}
          onChange={(e) => setCanvasBaseUrl(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Access token
        <input
          type="password"
          required
          autoComplete="off"
          placeholder="Paste token from Canvas settings"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-mono"
        />
      </label>

      <details className="mt-4 text-sm text-[var(--muted)]">
        <summary className="cursor-pointer font-medium text-[var(--foreground)]">
          How to get an access token
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Log in to Canvas with your school account.</li>
          <li>
            Open <strong>Account</strong> → <strong>Settings</strong>.
          </li>
          <li>
            Scroll to <strong>Approved Integrations</strong> →{" "}
            <strong>New Access Token</strong>.
          </li>
          <li>
            Name it (e.g. CanvasBuddy), leave expiry blank or set a date, then
            generate and copy the token.
          </li>
          <li>Paste the token above (you will not see it again in Canvas).</li>
        </ol>
      </details>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-60"
      >
        {submitting ? "Connecting…" : "Connect with access token"}
      </button>
    </form>
  );
}
