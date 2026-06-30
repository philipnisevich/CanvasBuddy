"use client";

import { AppProvider } from "@/contexts/AppProvider";
import { ThemeProvider } from "@/contexts/ThemeProvider";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <AppProvider>{children}</AppProvider>
    </ThemeProvider>
  );
}
