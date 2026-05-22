import type { GpaSummaryContext } from "@/lib/canvas/types";
import type { GpaPreferences } from "@/lib/gpa-preferences";

export interface CanvasAgentSource {
  type: string;
  title: string;
  url: string;
}

export interface AgentExecutorState {
  baseUrl: string;
  accessToken: string;
  timezone: string;
  todayDate: string;
  tomorrowDate: string;
  gpaSummary: GpaSummaryContext | null;
  gpaPreferences: GpaPreferences | null;
  activeCourseIds: Set<number>;
  sources: CanvasAgentSource[];
  toolCallCount: number;
  maxToolCalls: number;
}

export interface ToolExecutionResult {
  content: string;
  isError?: boolean;
}
