import Link from "next/link";
import { GraduationCap } from "lucide-react";

function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex cursor-pointer items-center gap-2.5 transition-opacity duration-200 hover:opacity-90"
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius)] ${
          onDark
            ? "bg-[var(--color-canvas-red)] text-white"
            : "border-2 border-[var(--color-canvas-red-dark)] bg-[var(--color-canvas-red)] text-white"
        }`}
        aria-hidden
      >
        <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span
        className={`font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight ${
          onDark
            ? "text-[var(--color-nav-text)]"
            : "text-[var(--color-text)] group-hover:text-[var(--color-canvas-red)]"
        }`}
      >
        CanvasBuddy
      </span>
    </Link>
  );
}

export default function AppShell({
  children,
  actions,
  subtitle,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="cb-skip-link">
        Skip to main content
      </a>
      <header className="cb-nav-shell">
        <div className="cb-nav-shell-inner flex flex-wrap items-center justify-between gap-4">
          <div>
            <Logo onDark />
            {subtitle && (
              <p className="mt-1 pl-12 text-sm font-medium text-[var(--color-nav-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <nav
              className="flex flex-wrap items-center gap-2"
              aria-label="Account"
            >
              {actions}
            </nav>
          )}
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-8 sm:py-10"
      >
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
        CanvasBuddy uses your student Canvas account — not an administrator
        login.
      </footer>
    </div>
  );
}

export function AppShellCentered({
  children,
  wide,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="cb-skip-link">
        Skip to main content
      </a>
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-16">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center gap-3 transition-opacity duration-200 hover:opacity-90"
          >
            <Logo />
          </Link>
        </div>
        <main
          id="main-content"
          className={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-lg"}
        >
          {children}
        </main>
      </div>
      <footer className="mx-auto max-w-6xl border-t border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
        Built for students — grades, deadlines, and study help in one place.
      </footer>
    </div>
  );
}
