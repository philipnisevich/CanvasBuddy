/** Where operators should set secrets (local vs hosted deployment). */
export function envSetupLocationHint(): string {
  if (process.env.NODE_ENV === "development") {
    return ".env.local, then restart the dev server (stop npm run dev and run it again)";
  }
  return "your hosting provider's environment variables (e.g. Vercel → Project → Settings → Environment Variables), then redeploy";
}
