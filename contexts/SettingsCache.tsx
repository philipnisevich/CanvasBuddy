"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useApp } from "@/contexts/AppProvider";

export interface SettingsCacheData {
  email: string | null;
  canvasBaseUrl: string;
  hasCredentials: boolean;
  dbReady: boolean;
  gpaDbReady: boolean;
  dbIssue: "missing_table" | "permission_denied" | "unknown";
  gpaDbIssue: "missing_table" | "permission_denied" | "unknown";
}

type CacheStatus = "idle" | "loading" | "ready" | "unauthenticated";

interface SettingsCacheValue {
  data: SettingsCacheData | null;
  status: CacheStatus;
  invalidate: () => void;
  refresh: () => Promise<void>;
}

const SettingsCacheContext = createContext<SettingsCacheValue | null>(null);

async function fetchSettingsData(): Promise<
  | { status: "ready"; data: SettingsCacheData }
  | { status: "unauthenticated" }
> {
  const meRes = await fetch("/api/auth/me");
  if (meRes.status === 401) {
    return { status: "unauthenticated" };
  }

  const me = await meRes.json();

  const [settingsRes, dbRes] = await Promise.all([
    fetch("/api/settings/canvas"),
    fetch("/api/settings/db-status"),
  ]);

  const data: SettingsCacheData = {
    email: me.user?.email ?? null,
    canvasBaseUrl: "",
    hasCredentials: false,
    dbReady: true,
    gpaDbReady: true,
    dbIssue: "unknown",
    gpaDbIssue: "unknown",
  };

  if (settingsRes.ok) {
    const settings = await settingsRes.json();
    data.hasCredentials = !!settings.hasCredentials;
    data.canvasBaseUrl = settings.canvasBaseUrl ?? "";
  }

  if (dbRes.ok) {
    const db = await dbRes.json();
    data.dbReady = !!db.ready;
    data.gpaDbReady = db.gpaReady !== false;
    if (db.issue === "missing_table" || db.issue === "permission_denied") {
      data.dbIssue = db.issue;
    }
    if (
      db.gpaIssue === "missing_table" ||
      db.gpaIssue === "permission_denied"
    ) {
      data.gpaDbIssue = db.gpaIssue;
    }
  }

  return { status: "ready", data };
}

export function SettingsCacheProvider({ children }: { children: ReactNode }) {
  const { gate, dataStatus } = useApp();
  const [status, setStatus] = useState<CacheStatus>("idle");
  const [data, setData] = useState<SettingsCacheData | null>(null);
  const fetchedRef = useRef(false);
  const invalidatedRef = useRef(false);

  const load = useCallback(async () => {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const result = await fetchSettingsData();
      if (result.status === "unauthenticated") {
        setStatus("unauthenticated");
        setData(null);
      } else {
        setData(result.data);
        setStatus("ready");
      }
    } catch {
      setStatus("idle");
    }
  }, [status]);

  useEffect(() => {
    if (gate.state !== "ready") {
      fetchedRef.current = false;
      invalidatedRef.current = false;
      setStatus("idle");
      setData(null);
      return;
    }

    if (fetchedRef.current && !invalidatedRef.current) return;

    // Wait until main data has started loading before prefetching settings
    if (dataStatus === "idle") return;

    fetchedRef.current = true;
    invalidatedRef.current = false;
    void load();
  }, [gate.state, dataStatus, load]);

  const invalidate = useCallback(() => {
    invalidatedRef.current = true;
    fetchedRef.current = false;
    setStatus("idle");
    setData(null);
  }, []);

  const refresh = useCallback(async () => {
    fetchedRef.current = true;
    invalidatedRef.current = false;
    await load();
  }, [load]);

  return (
    <SettingsCacheContext.Provider value={{ data, status, invalidate, refresh }}>
      {children}
    </SettingsCacheContext.Provider>
  );
}

export function useSettingsCache(): SettingsCacheValue {
  const ctx = useContext(SettingsCacheContext);
  if (!ctx) {
    throw new Error("useSettingsCache must be used within SettingsCacheProvider");
  }
  return ctx;
}
