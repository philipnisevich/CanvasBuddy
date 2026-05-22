"use client";

import { AppGateShell } from "@/components/AppGate";
import PageToolbar from "@/components/ui/PageToolbar";
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
      <PageToolbar
        label="Study helper"
        title="AI assistant"
        description="Ask about due dates, grades, assignments, and what's happening in your classes."
      />
      <AssignmentAssistant fullPage />
    </AppGateShell>
  );
}
