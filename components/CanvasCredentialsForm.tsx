"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";

interface CanvasCredentialsFormProps {
  initialCanvasBaseUrl?: string;
  onSuccess?: () => void;
  submitLabel?: string;
}

export default function CanvasCredentialsForm({
  initialCanvasBaseUrl = "",
  onSuccess,
  submitLabel = "Save Canvas connection",
}: CanvasCredentialsFormProps) {
  const [canvasBaseUrl, setCanvasBaseUrl] = useState(initialCanvasBaseUrl);
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/settings/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvasBaseUrl, accessToken }),
      });

      let body: { message?: string; ok?: boolean } = {};
      const text = await res.text();
      if (text) {
        try {
          body = JSON.parse(text) as { message?: string; ok?: boolean };
        } catch {
          body = { message: "Unexpected server response. Try again." };
        }
      }

      if (!res.ok) {
        setError(body.message ?? "Could not connect to Canvas.");
        return;
      }

      setAccessToken("");
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="text-left">
      <p className="text-sm text-[var(--muted)]">
        Use your normal <strong>student</strong> Canvas account to create a
        personal access token, then paste it here. Your token stays in your
        account and is only used to call Canvas on your behalf.
      </p>

      <label className="mt-5 block text-sm font-medium">
        Canvas URL
        <input
          type="url"
          required
          placeholder="https://yourschool.instructure.com"
          value={canvasBaseUrl}
          onChange={(e) => setCanvasBaseUrl(e.target.value)}
          className="cb-input mt-1.5"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Access token
        <input
          type="password"
          required
          autoComplete="off"
          placeholder={
            initialCanvasBaseUrl
              ? "Paste a new token to update"
              : "Paste token from Canvas → Settings"
          }
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="cb-input mt-1.5 font-mono"
        />
      </label>

      <details className="mt-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold">
          How to get an access token
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--muted)]">
          <li>Log in to Canvas with your school account.</li>
          <li>
            Open <strong className="text-[var(--foreground)]">Account</strong> →{" "}
            <strong className="text-[var(--foreground)]">Settings</strong>.
          </li>
          <li>
            Under <strong className="text-[var(--foreground)]">Approved Integrations</strong>, click{" "}
            <strong className="text-[var(--foreground)]">+ New Access Token</strong>.
          </li>
          <li>
            Name it (e.g. CanvasBuddy), create it, and copy the token immediately.
          </li>
          <li>Paste the token above — Canvas won&apos;t show it again.</li>
        </ol>
      </details>

      {error && <Alert className="mt-4">{error}</Alert>}

      <button
        type="submit"
        disabled={submitting}
        className="cb-btn-primary mt-6 w-full py-3"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
