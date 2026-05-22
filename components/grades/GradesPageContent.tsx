"use client";

import { AppGateShell } from "@/components/AppGate";
import Alert from "@/components/ui/Alert";
import PageToolbar from "@/components/ui/PageToolbar";
import GradesTable from "@/components/GradesTable";
import GpaCalculator from "@/components/GpaCalculator";
import { useApp } from "@/contexts/AppProvider";

export default function GradesPageContent() {
  const { gate, gradesData, dataStatus, dataError, refresh } = useApp();

  const showDataLoading =
    gate.state === "ready" && dataStatus === "loading" && !gradesData;

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
        label="Academic"
        title="Grades & GPA"
        description="Current grades from your active Canvas courses."
        actions={
          <button type="button" onClick={refresh} className="cb-btn-ghost">
            Refresh data
          </button>
        }
      />

      {dataError && (
        <Alert className="mb-6">
          <p>{dataError}</p>
          <button type="button" onClick={refresh} className="cb-link mt-2">
            Retry
          </button>
        </Alert>
      )}

      {showDataLoading && (
        <div className="animate-pulse h-48 rounded-[var(--radius)] bg-[var(--border)]" />
      )}

      {gradesData && (
        <div className="space-y-6">
          <GpaCalculator grades={gradesData.grades} />
          <GradesTable grades={gradesData.grades} />
        </div>
      )}
    </AppGateShell>
  );
}
