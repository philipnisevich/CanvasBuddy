"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/grades", label: "Grades" },
  { href: "/upcoming", label: "Upcoming" },
  { href: "/missing", label: "Missing" },
  { href: "/ai", label: "AI" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap items-center gap-1 sm:gap-2"
      aria-label="Main"
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`cursor-pointer rounded-[var(--radius)] px-3 py-2 text-sm font-semibold transition-colors duration-200 ${
              active
                ? "bg-white/15 text-[var(--color-nav-text)]"
                : "text-[var(--color-nav-muted)] hover:bg-white/10 hover:text-[var(--color-nav-text)]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
