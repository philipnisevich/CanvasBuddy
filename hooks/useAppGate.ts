"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AppGateState =
  | "loading"
  | "unauthenticated"
  | "needs_canvas"
  | "ready";

// Gate state resolved on the server (in layout.tsx) and handed to the client so
// the correct view — landing vs app — is already in the first HTML paint.
export interface InitialGate {
  state: AppGateState;
  userEmail: string | null;
  userName: string | null;
}

export function useAppGate(initial?: InitialGate) {
  const initialState = initial?.state ?? "loading";
  const [state, setState] = useState<AppGateState>(initialState);
  const [userEmail, setUserEmail] = useState<string | null>(
    initial?.userEmail ?? null
  );
  const [userName, setUserName] = useState<string | null>(
    initial?.userName ?? null
  );
  const [oauthEnabled, setOauthEnabled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkAuth = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setState("loading");
      setErrorMessage(null);
    }

    const meRes = await fetch("/api/auth/me");
    if (meRes.status === 401) {
      setState("unauthenticated");
      setUserEmail(null);
      setUserName(null);
      return;
    }

    const me = await meRes.json();
    setUserEmail(me.user?.email ?? null);
    setUserName(me.user?.name ?? me.user?.email ?? null);

    if (!me.hasCanvasCredentials) {
      setState("needs_canvas");
      return;
    }

    setState("ready");
  }, []);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((c: { oauthEnabled?: boolean }) =>
        setOauthEnabled(!!c.oauthEnabled)
      )
      .catch(() => setOauthEnabled(false));

    // When the server already resolved the gate, refresh silently so we don't
    // flash the loading state over the correct (server-rendered) view.
    checkAuth({ silent: initialState !== "loading" });

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setErrorMessage(decodeURIComponent(oauthError));
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkAuth]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Show the neutral boot splash — not the "unauthenticated" landing page —
    // while the browser navigates to the sign-in page. Rendering the landing
    // view here would flash it for a frame before /login loads.
    setState("loading");
    window.location.href = "/login";
  }, []);

  const getTimezone = useCallback((): string => {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
    );
  }, []);

  const setErrorMessageStable = useCallback((msg: string | null) => {
    setErrorMessage(msg);
  }, []);

  return useMemo(
    () => ({
      state,
      userEmail,
      userName,
      oauthEnabled,
      errorMessage,
      setErrorMessage: setErrorMessageStable,
      checkAuth,
      handleLogout,
      getTimezone,
    }),
    [
      state,
      userEmail,
      userName,
      oauthEnabled,
      errorMessage,
      setErrorMessageStable,
      checkAuth,
      handleLogout,
      getTimezone,
    ]
  );
}
