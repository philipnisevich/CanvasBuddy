"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";

type AccountPasswordSectionProps = {
  email: string;
  recoveryMode?: boolean;
  onRecoveryComplete?: () => void;
};

export default function AccountPasswordSection({
  email,
  recoveryMode = false,
  onRecoveryComplete,
}: AccountPasswordSectionProps) {
  return (
    <div className="space-y-8">
      {recoveryMode && (
        <CompletePasswordResetForm onSuccess={onRecoveryComplete} />
      )}

      <ChangePasswordForm hidden={recoveryMode} />

      <SendPasswordResetEmailForm email={email} />

      <DeleteAccountSection />
    </div>
  );
}

function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function closeForm() {
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

  async function handleDelete() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Could not delete your account.");
        return;
      }
      // Account and all associated data are gone — send them to the landing page.
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-[var(--border)] pt-6">
      <div className="cb-settings-section-head">
        <div>
          <h3 className="text-sm font-semibold text-[var(--danger-ink)]">
            Delete account
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Permanently delete your account, stored Canvas connection, and
            preferences. This cannot be undone.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cb-btn-danger shrink-0"
          >
            Delete account
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4">
          <p className="text-sm text-[var(--muted)]">
            Type <span className="font-semibold text-[var(--ink)]">DELETE</span>{" "}
            to confirm. This immediately removes your account and all data we
            store for you.
          </p>

          <label className="mt-4 block text-sm font-medium">
            Confirmation
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="cb-input mt-1.5"
              placeholder="DELETE"
              autoComplete="off"
            />
          </label>

          {error && <Alert className="mt-4">{error}</Alert>}

          <div className="cb-settings-actions mt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || confirmText !== "DELETE"}
              className="cb-btn-danger"
            >
              {submitting ? "Deleting…" : "Permanently delete account"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="cb-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChangePasswordForm({ hidden }: { hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (hidden) {
    return null;
  }

  function closeForm(keepSuccess = false) {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    if (!keepSuccess) {
      setSuccess(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-[var(--border)] pt-6">
      <div className="cb-settings-section-head">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Update your sign-in password for this account.
          </p>
        </div>
        {!open && !success && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cb-btn-secondary shrink-0"
          >
            Change password
          </button>
        )}
      </div>

      {success && !open && (
        <Alert variant="success" className="mt-4">
          Password updated.
        </Alert>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-4">
          <p className="text-sm text-[var(--muted)]">
            Enter your current password, then choose a new one.
          </p>

          <label className="mt-4 block text-sm font-medium">
            Current password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="cb-input mt-1.5"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            New password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="cb-input mt-1.5"
              placeholder="At least 6 characters"
            />
          </label>

          <label className="mt-4 block text-sm font-medium">
            Confirm new password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="cb-input mt-1.5"
            />
          </label>

          {error && <Alert className="mt-4">{error}</Alert>}
          {success && (
            <Alert variant="success" className="mt-4">
              Password updated.
            </Alert>
          )}

          <div className="cb-settings-actions mt-4">
            {!success && (
              <button
                type="submit"
                disabled={submitting}
                className="cb-btn-primary"
              >
                {submitting ? "Updating…" : "Update password"}
              </button>
            )}
            <button
              type="button"
              onClick={() => closeForm(success)}
              className="cb-btn-secondary"
            >
              {success ? "Done" : "Cancel"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CompletePasswordResetForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Could not set password.");
        return;
      }
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
      onSuccess?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[var(--radius)] border-2 border-[var(--accent)] bg-[var(--card-muted)] p-4">
      <h3 className="text-sm font-semibold">Set a new password</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        You opened a reset link from your email. Choose a new password below.
      </p>

      <label className="mt-4 block text-sm font-medium">
        New password
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="cb-input mt-1.5"
          placeholder="At least 6 characters"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Confirm new password
        <input
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="cb-input mt-1.5"
        />
      </label>

      {error && <Alert className="mt-4">{error}</Alert>}
      {success && (
        <Alert variant="success" className="mt-4">
          Password updated. You can continue using CanvasBuddy.
        </Alert>
      )}

      {!success && (
        <div className="cb-settings-actions mt-4">
          <button
            type="submit"
            disabled={submitting}
            className="cb-btn-primary"
          >
            {submitting ? "Saving…" : "Save new password"}
          </button>
        </div>
      )}
    </form>
  );
}

function SendPasswordResetEmailForm({ email }: { email: string }) {
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
        body: JSON.stringify({ email }),
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
    <form onSubmit={handleSubmit} className="border-t border-[var(--border)] pt-6">
      <div className="cb-settings-section-head">
        <div>
          <h3 className="text-sm font-semibold">Reset password by email</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            We will email a link to{" "}
            <strong className="text-[var(--foreground)]">{email}</strong>. Use
            it on this device to choose a new password.
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="cb-btn-secondary shrink-0"
        >
          {submitting ? "Sending…" : "Email me a reset link"}
        </button>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}
      {message && (
        <Alert variant="success" className="mt-4">
          {message}
        </Alert>
      )}
    </form>
  );
}
