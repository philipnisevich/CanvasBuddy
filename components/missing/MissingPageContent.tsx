"use client";

import { useState } from "react";
import { AppGateShell } from "@/components/AppGate";
import Alert from "@/components/ui/Alert";
import PageToolbar from "@/components/ui/PageToolbar";
import MissingAssignmentList from "@/components/missing/MissingAssignmentList";
import { useApp } from "@/contexts/AppProvider";

export default function MissingPageContent() {
  const { gate, missingData, dataStatus, dataError, refresh } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }

  const showDataLoading =
    gate.state === "ready" && dataStatus === "loading" && !missingData;

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
        label="Gradebook"
        title="Missing & overdue"
        description="Assignments marked missing, past due without submission, or scored zero."
        actions={
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="cb-btn-ghost"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      {dataError && <Alert className="mb-6">{dataError}</Alert>}

      {showDataLoading && (
        <div className="animate-pulse h-48 rounded-[var(--radius)] bg-[var(--border)]" />
      )}

      {missingData && (
        <>
          <div className="cb-card mb-8 p-5">
            <p className="cb-section-label">Summary</p>
            <p className="mt-1 font-[family-name:var(--font-heading)] text-3xl font-bold">
              {missingData.items.length}
            </p>
            <p className="text-sm text-[var(--muted)]">
              items need attention (last ~30 days)
            </p>
          </div>
          <MissingAssignmentList items={missingData.items} />
        </>
      )}
    </AppGateShell>
  );
}
