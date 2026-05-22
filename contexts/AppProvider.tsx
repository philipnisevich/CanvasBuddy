"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyHorizonDays,
  buildGradesPageData,
  buildHomeData,
  type AppDataPayload,
} from "@/lib/app-data";
import type { HomeData } from "@/lib/canvas/home-data";
import type { MissingPageData } from "@/lib/canvas/missing-data";
import type { UpcomingPageData } from "@/lib/canvas/upcoming-data";
import type { GradesPageData } from "@/lib/canvas/types";
import { normalizeLayoutConfigs } from "@/lib/home-widget-config";
import {
  DEFAULT_HOME_LAYOUT,
  normalizeHomeLayout,
  type HomeLayout,
} from "@/lib/home-layout";
import {
  DEFAULT_GPA_PREFERENCES,
  type GpaPreferences,
} from "@/lib/gpa-preferences";
import { useAppGate, type AppGateState } from "@/hooks/useAppGate";

const LAYOUT_STORAGE_KEY = "canvasbuddy-home-layout";

type DataStatus = "idle" | "loading" | "ready" | "error";

interface AppContextValue {
  gate: {
    state: AppGateState;
    userEmail: string | null;
    userName: string | null;
    oauthEnabled: boolean;
    errorMessage: string | null;
    setErrorMessage: (msg: string | null) => void;
    checkAuth: (opts?: { silent?: boolean }) => Promise<void>;
    handleLogout: () => Promise<void>;
    getTimezone: () => string;
  };
  dataStatus: DataStatus;
  dataError: string | null;
  payload: AppDataPayload | null;
  homeData: HomeData | null;
  missingData: MissingPageData | null;
  upcomingData: UpcomingPageData | null;
  gradesData: GradesPageData | null;
  homeLayout: HomeLayout;
  setHomeLayout: (layout: HomeLayout) => void;
  gpaPreferences: GpaPreferences;
  refresh: () => Promise<void>;
  setHorizonDays: (days: number) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const gate = useAppGate();
  const [dataStatus, setDataStatus] = useState<DataStatus>("idle");
  const [dataError, setDataError] = useState<string | null>(null);
  const [payload, setPayload] = useState<AppDataPayload | null>(null);
  const [homeLayout, setHomeLayoutState] = useState<HomeLayout>([
    ...DEFAULT_HOME_LAYOUT,
  ]);
  const [gpaPreferences, setGpaPreferences] = useState<GpaPreferences>(
    DEFAULT_GPA_PREFERENCES
  );
  const loadStartedRef = useRef(false);

  const loadAppData = useCallback(
    async (force = false) => {
      if (gate.state !== "ready") return;
      if (loadStartedRef.current && !force) return;

      loadStartedRef.current = true;
      setDataStatus("loading");
      setDataError(null);

      const tz = gate.getTimezone();
      try {
        const res = await fetch("/api/app-data", {
          headers: { "X-Timezone": tz },
        });
        const body = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            gate.setErrorMessage(
              body.message ?? "Canvas connection expired."
            );
            await gate.checkAuth();
            loadStartedRef.current = false;
            setDataStatus("idle");
            return;
          }
          setDataError(body.message ?? "Failed to load your Canvas data");
          setDataStatus("error");
          loadStartedRef.current = false;
          return;
        }

        const next = body as AppDataPayload;
        setPayload(next);
        setGpaPreferences(next.gpaPreferences ?? DEFAULT_GPA_PREFERENCES);

        const layout = normalizeLayoutConfigs(
          normalizeHomeLayout(next.homeLayout),
          next.grades
        );
        setHomeLayoutState(layout);
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));

        setDataStatus("ready");
      } catch {
        setDataError("Network error. Check your connection and try again.");
        setDataStatus("error");
        loadStartedRef.current = false;
      }
    },
    [gate.state, gate.getTimezone, gate.setErrorMessage, gate.checkAuth]
  );

  useEffect(() => {
    if (gate.state === "ready") {
      void loadAppData();
    } else {
      loadStartedRef.current = false;
      setDataStatus("idle");
      setPayload(null);
      setGpaPreferences(DEFAULT_GPA_PREFERENCES);
    }
  }, [gate.state, loadAppData]);

  const refresh = useCallback(async () => {
    loadStartedRef.current = false;
    await loadAppData(true);
  }, [loadAppData]);

  const setHomeLayout = useCallback((layout: HomeLayout) => {
    const normalized = normalizeHomeLayout(layout);
    setHomeLayoutState(normalized);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  const setHorizonDays = useCallback(
    async (days: number) => {
      if (!payload) return;
      setPayload(applyHorizonDays(payload, days));
      try {
        await fetch("/api/settings/upcoming", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ horizonDays: days }),
        });
      } catch {
        /* local refilter still applied */
      }
    },
    [payload]
  );

  const gradesData = useMemo(
    () => (payload ? buildGradesPageData(payload) : null),
    [payload]
  );

  const homeData = useMemo(
    () => (payload ? buildHomeData(payload) : null),
    [payload]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      gate: {
        state: gate.state,
        userEmail: gate.userEmail,
        userName: payload?.user.name ?? gate.userName,
        oauthEnabled: gate.oauthEnabled,
        errorMessage: gate.errorMessage,
        setErrorMessage: gate.setErrorMessage,
        checkAuth: gate.checkAuth,
        handleLogout: gate.handleLogout,
        getTimezone: gate.getTimezone,
      },
      dataStatus,
      dataError,
      payload,
      homeData,
      missingData: payload?.missing ?? null,
      upcomingData: payload?.upcoming ?? null,
      gradesData,
      homeLayout,
      setHomeLayout,
      gpaPreferences,
      refresh,
      setHorizonDays,
    }),
    [
      gate,
      payload,
      dataStatus,
      dataError,
      homeData,
      gradesData,
      homeLayout,
      setHomeLayout,
      gpaPreferences,
      refresh,
      setHorizonDays,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
