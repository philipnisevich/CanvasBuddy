import { Suspense } from "react";
import LoginPageContent from "./LoginPageContent";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-64 rounded-xl bg-slate-200 dark:bg-slate-700" />
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
