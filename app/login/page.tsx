import { Suspense } from "react";
import LoginPageContent from "./LoginPageContent";

function LoginFallback() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="h-[3.75rem] border-b border-[var(--hairline)]" />
      <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-[var(--radius)] bg-[var(--hairline)]" />
          <div className="h-4 w-72 rounded-[var(--radius)] bg-[var(--hairline)]" />
          <div className="h-80 rounded-[var(--radius-lg)] bg-[var(--hairline)]" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
