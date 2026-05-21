export default function LoginButton() {
  return (
    <a
      href="/api/auth/canvas"
      className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
    >
      Sign in with Canvas
    </a>
  );
}
