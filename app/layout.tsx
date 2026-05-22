import type { Metadata } from "next";
import { Lato, Source_Sans_3 } from "next/font/google";
import ClientRoot from "@/components/ClientRoot";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "700", "900"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CanvasBuddy — Your student Canvas dashboard",
  description:
    "Grades, assignments due tomorrow, GPA estimates, and an AI study assistant for your Canvas courses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lato.variable} ${sourceSans.variable}`}>
      <body className="min-h-screen antialiased">
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
