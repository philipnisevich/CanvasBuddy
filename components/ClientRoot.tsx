"use client";

import { AppProvider } from "@/contexts/AppProvider";
import { ChatProvider } from "@/contexts/ChatProvider";
import { SettingsCacheProvider } from "@/contexts/SettingsCache";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider>
      <SettingsCacheProvider>
        <ChatProvider>{children}</ChatProvider>
      </SettingsCacheProvider>
    </AppProvider>
  );
}
