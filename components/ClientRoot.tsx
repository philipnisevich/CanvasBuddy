"use client";

import { AppProvider } from "@/contexts/AppProvider";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import type { InitialGate } from "@/hooks/useAppGate";

export default function ClientRoot({
  children,
  initialGate,
}: {
  children: React.ReactNode;
  initialGate?: InitialGate;
}) {
  return (
    <ThemeProvider>
      <AppProvider initialGate={initialGate}>{children}</AppProvider>
    </ThemeProvider>
  );
}
