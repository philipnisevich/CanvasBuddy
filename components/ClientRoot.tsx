"use client";

import { AppProvider } from "@/contexts/AppProvider";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppProvider>{children}</AppProvider>;
}
