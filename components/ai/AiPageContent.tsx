"use client";

import { AppGateShell } from "@/components/AppGate";
import AssignmentAssistant from "@/components/AssignmentAssistant";
import { useApp } from "@/contexts/AppProvider";

export default function AiPageContent() {
  const { gate } = useApp();

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
      <div className="-mx-2 sm:mx-0">
        <AssignmentAssistant fullPage />
      </div>
    </AppGateShell>
  );
}
