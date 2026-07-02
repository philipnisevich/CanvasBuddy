import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { LEGAL_LAST_UPDATED, readLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Subprocessors — CanvasBuddy",
  description: "The third-party service providers CanvasBuddy relies on.",
};

export default function SubprocessorsPage() {
  return (
    <LegalPage
      title="Subprocessors"
      lastUpdated={LEGAL_LAST_UPDATED}
      content={readLegalDoc("subprocessors")}
    />
  );
}
