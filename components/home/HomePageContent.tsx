"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AppGateShell } from "@/components/AppGate";
import Alert from "@/components/ui/Alert";
import PageToolbar from "@/components/ui/PageToolbar";
import WidgetGrid from "@/components/home/WidgetGrid";
import WidgetPickerModal from "@/components/home/WidgetPickerModal";
import WidgetConfigDialog from "@/components/home/WidgetConfigDialog";
import type { HomeWidgetInstance, WidgetConfig } from "@/lib/home-layout";
import { useApp } from "@/contexts/AppProvider";
import { normalizeHomeLayout, type HomeLayout } from "@/lib/home-layout";

export default function HomePageContent() {
  const app = useApp();
  const {
    gate,
    homeData,
    homeLayout,
    setHomeLayout,
    dataStatus,
    dataError,
    refresh,
    refreshing,
  } = app;

  const [editMode, setEditMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [configWidget, setConfigWidget] = useState<HomeWidgetInstance | null>(
    null
  );
  const [savingLayout, setSavingLayout] = useState(false);
  const [layoutWarning, setLayoutWarning] = useState<string | null>(null);
  const layoutSnapshotRef = useRef<HomeLayout | null>(null);

  function startCustomize() {
    layoutSnapshotRef.current = homeLayout.map((w) => ({ ...w }));
    setEditMode(true);
  }

  function cancelCustomize() {
    if (layoutSnapshotRef.current) {
      setHomeLayout(layoutSnapshotRef.current);
    }
    layoutSnapshotRef.current = null;
    setPickerOpen(false);
    setConfigWidget(null);
    setEditMode(false);
  }

  function saveWidgetConfig(widgetId: string, config: WidgetConfig) {
    setHomeLayout(
      homeLayout.map((w) =>
        w.id === widgetId ? { ...w, config: { ...w.config, ...config } } : w
      )
    );
  }

  async function finishCustomize() {
    setSavingLayout(true);
    setLayoutWarning(null);
    try {
      const res = await fetch("/api/home-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: homeLayout }),
      });
      const body = await res.json();
      if (res.ok) {
        setHomeLayout(normalizeHomeLayout(body.layout));
        if (body.persisted === false && body.hint) {
          setLayoutWarning(body.hint);
        } else {
          setLayoutWarning(null);
        }
      } else if (body.message) {
        setLayoutWarning(body.message);
      }
    } catch {
      setLayoutWarning("Saved locally only — could not sync to account.");
    } finally {
      setSavingLayout(false);
      layoutSnapshotRef.current = null;
      setConfigWidget(null);
      setPickerOpen(false);
      setEditMode(false);
    }
  }

  const showDataLoading =
    gate.state === "ready" && dataStatus === "loading" && !homeData;

  return (
    <AppGateShell
      state={gate.state}
      userEmail={gate.userEmail}
      userName={gate.userName}
      oauthEnabled={gate.oauthEnabled}
      errorMessage={gate.errorMessage}
      onLogout={gate.handleLogout}
      showNav
    >
      <PageToolbar
        title="Your dashboard"
        description="Customize widgets to see what matters most."
        actions={
          homeData && !editMode ? (
            <>
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="cb-btn-ghost"
                title="Reload Canvas data"
              >
                Refresh
              </button>
              <button type="button" onClick={startCustomize} className="cb-btn-secondary">
                Customize layout
              </button>
            </>
          ) : undefined
        }
      />

      {editMode && (
        <div className="cb-edit-banner" role="status">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            Editing your layout — drag widgets, resize, or add new ones.
          </p>
          <div className="cb-page-actions ml-auto">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="cb-btn-secondary inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add widget
            </button>
            <button type="button" onClick={cancelCustomize} className="cb-btn-ghost">
              Cancel
            </button>
            <button
              type="button"
              onClick={finishCustomize}
              disabled={savingLayout}
              className="cb-btn-primary"
            >
              {savingLayout ? "Saving…" : "Save layout"}
            </button>
          </div>
        </div>
      )}

      {layoutWarning && <Alert className="mb-4">{layoutWarning}</Alert>}
      {dataError && (
        <Alert className="mb-6">
          <p>{dataError}</p>
          <button type="button" onClick={refresh} className="cb-link mt-2">
            Retry
          </button>
        </Alert>
      )}

      {showDataLoading && (
        <div className="animate-pulse h-64 rounded-[var(--radius)] bg-[var(--border)]" />
      )}

      {homeData && (
        <>
          <WidgetGrid
            layout={homeLayout}
            data={homeData}
            editMode={editMode}
            onLayoutChange={setHomeLayout}
            onConfigureWidget={editMode ? setConfigWidget : undefined}
          />
          <WidgetConfigDialog
            widget={configWidget}
            grades={homeData.grades}
            open={configWidget != null}
            onClose={() => setConfigWidget(null)}
            onSave={saveWidgetConfig}
          />
          <WidgetPickerModal
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            data={homeData}
            layout={homeLayout}
            onAdd={setHomeLayout}
          />
        </>
      )}
    </AppGateShell>
  );
}
