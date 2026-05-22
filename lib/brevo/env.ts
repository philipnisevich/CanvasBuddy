import { envSetupLocationHint } from "@/lib/env-deploy-hint";
import { getAsciiEnvVarError } from "@/lib/env-ascii";

export function getBrevoEnvError(): string | null {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();

  if (!apiKey || !senderEmail) {
    return `Brevo is not configured. Add BREVO_API_KEY and BREVO_SENDER_EMAIL to ${envSetupLocationHint()} (use a verified sender in Brevo).`;
  }

  const apiAscii = getAsciiEnvVarError("BREVO_API_KEY", apiKey);
  if (apiAscii) {
    return apiAscii;
  }

  const senderAscii = getAsciiEnvVarError("BREVO_SENDER_EMAIL", senderEmail);
  if (senderAscii) {
    return senderAscii;
  }

  if (!apiKey.startsWith("xkeysib-")) {
    return "BREVO_API_KEY must be your Brevo API key (starts with xkeysib-), not placeholder text.";
  }

  if (!senderEmail.includes("@")) {
    return "BREVO_SENDER_EMAIL must be a verified sender email address, not placeholder text.";
  }

  return null;
}
