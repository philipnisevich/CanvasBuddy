"use client";

import { useState } from "react";
import { AppGateShell } from "@/components/AppGate";
import Alert from "@/components/ui/Alert";
import PageToolbar from "@/components/ui/PageToolbar";
import DueTomorrowList from "@/components/DueTomorrowList";
import UpcomingAssignmentList from "@/components/upcoming/UpcomingAssignmentList";
import { useApp } from "@/contexts/AppProvider";

const HORIZON_OPTIONS = [2, 3, 5, 7, 14];

export default function UpcomingPageContent() {
  const {
    gate,
    upcomingData,
    dataStatus,
    dataError,
    refresh,
    setHorizonDays,
    payload,
  } = useApp();
  const [savingHorizon, setSavingHorizon] = useState(false);

  const horizonDays = payload?.horizonDays ?? 3;

  async function saveHorizon(days: number) {
    setSavingHorizon(true);
    try {
      await setHorizonDays(days);
    } finally {
      setSavingHorizon(false);
    }
  }

  const showDataLoading =
    gate.state === "ready" && dataStatus === "loading" && !upcomingData;

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
        label="Planner"
        title="Upcoming"
        description="Due tomorrow plus assignments in the next few days."
        actions={
          <button type="button" onClick={refresh} className="cb-btn-ghost">
            Refresh data
          </button>
        }
      />

      {dataError && <Alert className="mb-6">{dataError}</Alert>}

      {showDataLoading && (
        <div className="animate-pulse h-48 rounded-[var(--radius)] bg-[var(--border)]" />
      )}

      {upcomingData && (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-xl font-semibold">Due tomorrow</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              {upcomingData.tomorrowDate}
            </p>
            <DueTomorrowList
              items={upcomingData.dueTomorrow}
              tomorrowDate={upcomingData.tomorrowDate}
            />
          </section>

          <div className="cb-card p-5">
            <p className="text-sm font-semibold">Reminder window</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Show assignments due in the next N days (not including tomorrow).
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {HORIZON_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={savingHorizon}
                  onClick={() => saveHorizon(d)}
                  className={`cb-chip ${horizonDays === d ? "cb-chip--active" : ""}`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Coming up</h2>
            <p className="mb-4 text-sm text-[var(--muted)]">
              After tomorrow, within the next {upcomingData.horizonDays} days
            </p>
            <UpcomingAssignmentList
              items={upcomingData.upcoming}
              emptyMessage={`Nothing else due in the next ${upcomingData.horizonDays} days after tomorrow.`}
            />
          </section>
        </div>
      )}
    </AppGateShell>
  );
}
