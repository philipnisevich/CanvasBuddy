import Link from "next/link";
import { GraduationCap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Slugify heading text so in-document anchor links (e.g. #your-rights) resolve. */
function slugify(children: React.ReactNode): string {
  const text = Array.isArray(children)
    ? children.map((c) => (typeof c === "string" ? c : "")).join("")
    : typeof children === "string"
      ? children
      : "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function LegalPage({
  title,
  lastUpdated,
  content,
}: {
  title: string;
  lastUpdated: string;
  content: string;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--hairline)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-bold text-[var(--ink)]"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--accent)] text-[var(--on-accent)]"
              aria-hidden
            >
              <GraduationCap className="h-5 w-5" strokeWidth={2.25} />
            </span>
            CanvasBuddy
          </Link>
          <Link href="/" className="cb-btn-secondary-nav">
            Back to app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--ink)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Last updated: {lastUpdated}</p>

        <div className="cb-legal-prose mt-10">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => (
                <h2 id={slugify(children)}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 id={slugify(children)}>{children}</h3>
              ),
              a: ({ href, children }) => {
                const isInternal = href?.startsWith("/") || href?.startsWith("#");
                if (isInternal) {
                  return (
                    <Link href={href ?? "#"} className="cb-link">
                      {children}
                    </Link>
                  );
                }
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cb-link"
                  >
                    {children}
                  </a>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </main>

      <footer className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:px-6">
          <span className="inline-flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-[var(--accent-ink)]" aria-hidden />
            CanvasBuddy
          </span>
          <span className="flex gap-4">
            <Link href="/privacy" className="cb-link">
              Privacy
            </Link>
            <Link href="/terms" className="cb-link">
              Terms
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
