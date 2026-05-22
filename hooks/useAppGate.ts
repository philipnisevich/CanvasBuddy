"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AppGateState =
  | "loading"
  | "unauthenticated"
  | "needs_canvas"
  | "ready";

export function useAppGate() {
  const [state, setState] = useState<AppGateState>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
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

    checkAuth();

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) {
      setErrorMessage(decodeURIComponent(oauthError));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkAuth]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState("unauthenticated");
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
