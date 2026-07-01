import Link from "next/link";
import { GraduationCap } from "lucide-react";
import AppNav from "@/components/ui/AppNav";

function Logo({ linked = true }: { linked?: boolean }) {
  const mark = (
    <>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--on-accent)]"
        aria-hidden
      >
        <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
      </span>
      <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--ink)] transition-colors duration-200 group-hover:text-[var(--accent-ink)]">
        CanvasBuddy
      </span>
    </>
  );

  if (!linked) {
    return (
      <span className="group inline-flex items-center gap-2.5">{mark}</span>
    );
  }

  return (
    <Link
      href="/"
      className="group flex cursor-pointer items-center gap-2.5"
    >
      {mark}
    </Link>
  );
}

export default function AppShell({
  children,
  actions,
  subtitle,
  showNav = false,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: string;
  showNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <a href="#main-content" className="cb-skip-link">
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--bg)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <Logo />
            <nav
              className="flex flex-wrap items-center gap-2"
              aria-label="Account"
            >
              {actions}
            </nav>
          </div>
          {(showNav || subtitle) && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[var(--hairline)] py-1.5">
              {showNav ? <AppNav /> : <span />}
              {subtitle && (
                <p className="hidden truncate text-sm font-medium text-[var(--muted-ink)] sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
      >
        {children}
      </main>
      <footer className="mx-auto max-w-6xl border-t border-[var(--hairline)] px-4 py-8 text-center text-sm text-[var(--muted-ink)] sm:px-6">
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
    <div className="min-h-screen bg-[var(--bg)]">
      <a href="#main-content" className="cb-skip-link">
        Skip to main content
      </a>
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center gap-3 transition-opacity duration-200 hover:opacity-90"
          >
            <Logo linked={false} />
          </Link>
        </div>
        <main
          id="main-content"
          className={wide ? "mx-auto max-w-3xl" : "mx-auto max-w-lg"}
        >
          {children}
        </main>
      </div>
      <footer className="mx-auto max-w-6xl border-t border-[var(--hairline)] px-4 py-8 text-center text-sm text-[var(--muted-ink)] sm:px-6">
        Built for students — grades, deadlines, and study help in one place.
      </footer>
    </div>
  );
}
