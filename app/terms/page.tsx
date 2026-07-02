import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { LEGAL_LAST_UPDATED, readLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — CanvasBuddy",
  description: "The terms that govern your use of CanvasBuddy.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={LEGAL_LAST_UPDATED}
      content={readLegalDoc("terms")}
    />
  );
}
