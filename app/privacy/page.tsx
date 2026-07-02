import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";
import { LEGAL_LAST_UPDATED, readLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — CanvasBuddy",
  description: "How CanvasBuddy collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LEGAL_LAST_UPDATED}
      content={readLegalDoc("privacy")}
    />
  );
}
