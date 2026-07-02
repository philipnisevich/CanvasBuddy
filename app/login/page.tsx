import LoginPageContent from "./LoginPageContent";

// Read the routing intent (sign in vs. create account, forgot-password, and any
// auth-callback error) from the URL on the server so the sign-in page renders
// its final form in the first paint. Reading these via useSearchParams instead
// forces a Suspense boundary, which flashed a skeleton for a beat on navigation.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; forgot?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <LoginPageContent
      initialMode={params.mode === "signup" ? "signup" : "signin"}
      forgotMode={params.forgot === "1"}
      callbackError={
        params.error === "auth_callback_failed"
          ? "Sign-in link expired or was invalid. Please try again."
          : null
      }
    />
  );
}
