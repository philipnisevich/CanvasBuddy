import type { Metadata } from "next";
import { Source_Serif_4, Source_Sans_3, Source_Code_Pro } from "next/font/google";
import ClientRoot from "@/components/ClientRoot";
import "./globals.css";

// Headings: a transitional, scholarly serif from the Source superfamily —
// pairs on a true contrast axis with Source Sans 3 and carries the
// "academic / Clear Ledger" credibility called for in DESIGN.md.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["600", "700"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Numerics: the ledger voice — receipt-precise tabular figures on GPA,
// counts and grade columns. Same superfamily for cohesion.
const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CanvasBuddy — Your student Canvas dashboard",
  description:
    "Grades, assignments due tomorrow, GPA estimates, and an AI study assistant for your Canvas courses.",
};

// Set theme + accent on <html> before first paint to avoid a flash of the
// wrong theme. Mirrors the defaults in contexts/ThemeProvider.tsx.
const themeScript = `(function(){try{var m=localStorage.getItem('cb-theme-mode')||'system';var a=localStorage.getItem('cb-accent')||'ink';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.dataset.theme=d?'dark':'light';e.dataset.accent=a;}catch(_){var e=document.documentElement;e.dataset.theme='light';e.dataset.accent='ink';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-accent="ink"
      className={`${sourceSerif.variable} ${sourceSans.variable} ${sourceCode.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
