import {
  getTomorrowYmd,
  getYmdInTimezone,
  formatDueAt,
} from "@/lib/dates";
import { stripHtml } from "@/lib/html";
import {
  fetchCanvasJson,
  fetchCanvasPaginated,
  CanvasApiError,
} from "@/lib/canvas/client-core";
import { fetchCoursesWithGrades } from "@/lib/canvas/courses";
import { mapCourseGrades } from "@/lib/canvas/grades";
import type { CanvasAssignment, CanvasCourse } from "@/lib/canvas/types";
import { calculateGpa } from "@/lib/gpa";
import { DEFAULT_GPA_PREFERENCES, type GpaPreferences } from "@/lib/gpa-preferences";
import type { AgentExecutorState, CanvasAgentSource, ToolExecutionResult } from "./types";
import { CANVAS_AGENT_TOOL_NAMES } from "./tools";

const MAX_RESULT_CHARS = Number(process.env.CANVAS_AGENT_MAX_RESULT_CHARS) || 8000;
const MAX_LIST_ITEMS = 30;

function resolveHtmlUrl(baseUrl: string, url: string | undefined): string {
  if (!url) return baseUrl;
  if (url.startsWith("http")) return url;
  return `${baseUrl}${url}`;
}

function truncateForModel(text: string): string {
  if (text.length <= MAX_RESULT_CHARS) return text;
  return `${text.slice(0, MAX_RESULT_CHARS)}\n…(truncated)`;
}

function sanitizeHtmlField(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const plain = stripHtml(value);
  return plain || null;
}

function recordSource(
  state: AgentExecutorState,
  source: Omit<CanvasAgentSource, "url"> & { url?: string | null }
) {
  if (!source.url) return;
  const url = resolveHtmlUrl(state.baseUrl, source.url);
  const exists = state.sources.some((s) => s.url === url);
  if (!exists) {
    state.sources.push({ type: source.type, title: source.title, url });
  }
}

function parseCourseId(value: unknown): number | null {
  const id = Number(value);
  if (!Number.isFinite(id) || id <= 0) return null;
  return Math.floor(id);
}

function assertCourseAllowed(
  state: AgentExecutorState,
  courseId: number
): string | null {
  if (!Number.isFinite(courseId) || courseId <= 0) {
    return "Invalid course_id.";
  }
  if (!state.activeCourseIds.size) {
    return "Call list_active_courses first to load allowed course ids.";
  }
  if (!state.activeCourseIds.has(courseId)) {
    return `course_id ${courseId} is not in the student's active courses. Use list_active_courses and a valid id.`;
  }
  return null;
}

function bumpToolCount(state: AgentExecutorState): string | null {
  if (state.toolCallCount >= state.maxToolCalls) {
    return `Tool call limit (${state.maxToolCalls}) reached for this question. Answer with what you have.`;
  }
  state.toolCallCount += 1;
  return null;
}

async function toolListActiveCourses(
  state: AgentExecutorState
): Promise<ToolExecutionResult> {
  const courses = await fetchCoursesWithGrades(
    state.baseUrl,
    state.accessToken,
    ["active"]
  );
  state.activeCourseIds.clear();
  for (const c of courses) {
    state.activeCourseIds.add(c.id);
  }

  const lines = courses.map(
    (c) =>
      `- id=${c.id} name=${JSON.stringify(c.name)}${c.course_code ? ` code=${JSON.stringify(c.course_code)}` : ""}`
  );

  return {
    content: truncateForModel(
      [
        `Active courses (${courses.length}):`,
        lines.join("\n") || "(none)",
        "",
        `Today: ${state.todayDate}`,
        `Tomorrow: ${state.tomorrowDate}`,
        `Timezone: ${state.timezone}`,
      ].join("\n")
    ),
  };
}

async function toolGetCourseSyllabus(
  state: AgentExecutorState,
  courseId: number
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const course = await fetchCanvasJson<CanvasCourse & { syllabus_body?: string }>(
    state.baseUrl,
    `/api/v1/courses/${courseId}?include[]=syllabus_body`,
    state.accessToken
  );

  const body = sanitizeHtmlField(course.syllabus_body);
  const url = `/courses/${courseId}/assignments/syllabus`;

  if (body) {
    recordSource(state, {
      type: "syllabus",
      title: `${course.name} syllabus`,
      url,
    });
    return {
      content: truncateForModel(
        `Course: ${course.name}\nSyllabus:\n${body}`
      ),
    };
  }

  return {
    content: `Course: ${course.name}\nNo syllabus_body on course settings. Try list_pages with search_term "syllabus" or get_front_page.`,
  };
}

interface CanvasSearchResult {
  title?: string;
  content?: string;
  html_url?: string;
  due_at?: string | null;
  type?: string;
}

async function toolSearchCourse(
  state: AgentExecutorState,
  courseId: number,
  searchTerm: string
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const term = searchTerm.trim();
  if (term.length < 2) {
    return { content: "search_term must be at least 2 characters.", isError: true };
  }

  const encoded = encodeURIComponent(term);
  const results = await fetchCanvasPaginated<CanvasSearchResult>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/search?search_term=${encoded}&per_page=50`,
    state.accessToken
  );

  const lines = results.slice(0, MAX_LIST_ITEMS).map((r) => {
    const title = r.title ?? "(untitled)";
    const type = r.type ?? "item";
    const due = r.due_at ? ` due=${formatDueAt(r.due_at, state.timezone)}` : "";
    const excerpt = sanitizeHtmlField(r.content);
    const excerptLine = excerpt ? `\n  excerpt: ${excerpt.slice(0, 400)}` : "";
    if (r.html_url) {
      recordSource(state, { type, title, url: r.html_url });
    }
    return `- [${type}] ${title}${due}${excerptLine}${r.html_url ? `\n  url: ${resolveHtmlUrl(state.baseUrl, r.html_url)}` : ""}`;
  });

  return {
    content: truncateForModel(
      [
        `Search "${term}" in course ${courseId}: ${results.length} result(s)`,
        lines.join("\n") || "(no matches)",
      ].join("\n")
    ),
  };
}

interface CanvasDiscussionTopic {
  id: number;
  title?: string;
  message?: string;
  posted_at?: string;
  html_url?: string;
}

async function toolListAnnouncements(
  state: AgentExecutorState,
  courseId: number,
  limit?: number
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const cap = Math.min(Math.max(limit ?? 15, 1), MAX_LIST_ITEMS);
  const topics = await fetchCanvasPaginated<CanvasDiscussionTopic>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/discussion_topics?only_announcements=true&per_page=${cap}`,
    state.accessToken
  );

  const lines = topics.slice(0, cap).map((t) => {
    const title = t.title ?? "(untitled)";
    const posted = t.posted_at
      ? formatDueAt(t.posted_at, state.timezone)
      : "unknown date";
    const excerpt = sanitizeHtmlField(t.message);
    if (t.html_url) {
      recordSource(state, { type: "announcement", title, url: t.html_url });
    }
    return `- ${title} (posted ${posted})${excerpt ? `\n  ${excerpt.slice(0, 500)}` : ""}`;
  });

  return {
    content: truncateForModel(
      `Announcements (${topics.length}):\n${lines.join("\n") || "(none)"}`
    ),
  };
}

async function toolListAssignments(
  state: AgentExecutorState,
  courseId: number,
  opts: {
    search_term?: string;
    due_on_or_after?: string;
    due_on_or_before?: string;
  }
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  let assignments = await fetchCanvasPaginated<CanvasAssignment>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/assignments?include[]=submission&order_by=due_at&per_page=100`,
    state.accessToken
  );

  assignments = assignments.filter((a) => a.published !== false);

  const q = opts.search_term?.trim().toLowerCase();
  if (q) {
    assignments = assignments.filter((a) =>
      (a.name ?? "").toLowerCase().includes(q)
    );
  }

  if (opts.due_on_or_after) {
    assignments = assignments.filter((a) => {
      if (!a.due_at) return false;
      return getYmdInTimezone(a.due_at, state.timezone) >= opts.due_on_or_after!;
    });
  }
  if (opts.due_on_or_before) {
    assignments = assignments.filter((a) => {
      if (!a.due_at) return false;
      return getYmdInTimezone(a.due_at, state.timezone) <= opts.due_on_or_before!;
    });
  }

  const lines = assignments.slice(0, MAX_LIST_ITEMS).map((a) => {
    const due = formatDueAt(a.due_at, state.timezone);
    const sub = a.submission;
    const status = sub?.workflow_state ?? "unsubmitted";
    const missing = sub?.missing ? " missing" : "";
    const late = sub?.late ? " late" : "";
    const excused = sub?.excused ? " excused" : "";
    const pts = a.points_possible != null ? `/${a.points_possible}` : "";
    let scorePart = "";
    if (sub?.excused) {
      scorePart = " | score: excused";
    } else if (sub?.score != null) {
      scorePart = ` | score: ${sub.score}${pts}`;
      if (sub.grade && sub.grade !== String(sub.score)) {
        scorePart += ` (${sub.grade})`;
      }
    } else if (a.points_possible != null) {
      scorePart = ` | points_possible: ${a.points_possible}`;
    }
    if (a.html_url) {
      recordSource(state, {
        type: "assignment",
        title: a.name,
        url: a.html_url,
      });
    }
    const desc = sanitizeHtmlField(a.description);
    return `- id=${a.id} ${a.name} | due: ${due} | status: ${status}${missing}${late}${excused}${scorePart}${desc ? `\n  instructions: ${desc.slice(0, 400)}` : ""}`;
  });

  return {
    content: truncateForModel(
      `Assignments (${assignments.length}):\n${lines.join("\n") || "(none matching filters)"}`
    ),
  };
}

interface CanvasModule {
  id: number;
  name?: string;
  position?: number;
}

async function toolListModules(
  state: AgentExecutorState,
  courseId: number
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const modules = await fetchCanvasPaginated<CanvasModule>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/modules?per_page=100`,
    state.accessToken
  );

  const lines = modules.map(
    (m) => `- module_id=${m.id} name=${JSON.stringify(m.name ?? "Module")}`
  );

  return {
    content: truncateForModel(
      `Modules (${modules.length}):\n${lines.join("\n") || "(none)"}`
    ),
  };
}

interface CanvasModuleItem {
  id: number;
  title?: string;
  type?: string;
  html_url?: string;
  page_url?: string;
  position?: number;
}

async function toolListModuleItems(
  state: AgentExecutorState,
  courseId: number,
  moduleId: number
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const items = await fetchCanvasPaginated<CanvasModuleItem>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/modules/${moduleId}/items?per_page=100`,
    state.accessToken
  );

  const lines = items.slice(0, MAX_LIST_ITEMS).map((item) => {
    const title = item.title ?? "(untitled)";
    const type = item.type ?? "Item";
    if (item.html_url) {
      recordSource(state, { type: "module_item", title, url: item.html_url });
    }
    const pageHint = item.page_url ? ` page_url=${item.page_url}` : "";
    return `- [${type}] ${title}${pageHint}`;
  });

  return {
    content: truncateForModel(
      `Module ${moduleId} items (${items.length}):\n${lines.join("\n") || "(none)"}`
    ),
  };
}

interface CanvasWikiPage {
  page_id: number;
  url?: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
}

async function toolListPages(
  state: AgentExecutorState,
  courseId: number,
  searchTerm?: string
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  let pages = await fetchCanvasPaginated<CanvasWikiPage>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/pages?per_page=100`,
    state.accessToken
  );

  const q = searchTerm?.trim().toLowerCase();
  if (q) {
    pages = pages.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.url ?? "").toLowerCase().includes(q)
    );
  }

  const lines = pages.slice(0, MAX_LIST_ITEMS).map((p) => {
    return `- title=${JSON.stringify(p.title ?? "")} page_url=${JSON.stringify(p.url ?? "")}`;
  });

  return {
    content: truncateForModel(
      `Wiki pages (${pages.length}):\n${lines.join("\n") || "(none)"}\nUse get_page with page_url to read body.`
    ),
  };
}

interface CanvasWikiPageBody {
  title?: string;
  body?: string;
  url?: string;
  html_url?: string;
}

async function toolGetPage(
  state: AgentExecutorState,
  courseId: number,
  pageUrl: string
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const slug = pageUrl.trim().replace(/^\/+/, "");
  if (!slug || slug.includes("..")) {
    return { content: "Invalid page_url.", isError: true };
  }

  const page = await fetchCanvasJson<CanvasWikiPageBody>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/pages/${encodeURIComponent(slug)}`,
    state.accessToken
  );

  const body = sanitizeHtmlField(page.body);
  const url = page.html_url ?? `/courses/${courseId}/pages/${slug}`;
  recordSource(state, {
    type: "page",
    title: page.title ?? slug,
    url,
  });

  return {
    content: truncateForModel(
      `Page: ${page.title ?? slug}\n${body ?? "(empty body)"}`
    ),
  };
}

interface CanvasCalendarEvent {
  id: number;
  title?: string;
  description?: string;
  start_at?: string;
  end_at?: string;
  html_url?: string;
  location_name?: string;
}

async function toolListCalendarEvents(
  state: AgentExecutorState,
  courseId: number,
  startDate?: string,
  endDate?: string
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const start =
    startDate ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end =
    endDate ??
    new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    type: "event",
    per_page: "50",
    start_date: start,
    end_date: end,
  });
  params.append("context_codes[]", `course_${courseId}`);

  const events = await fetchCanvasPaginated<CanvasCalendarEvent>(
    state.baseUrl,
    `/api/v1/calendar_events?${params.toString()}`,
    state.accessToken
  );

  const lines = events.slice(0, MAX_LIST_ITEMS).map((e) => {
    const when = e.start_at
      ? formatDueAt(e.start_at, state.timezone)
      : "no start";
    const desc = sanitizeHtmlField(e.description);
    if (e.html_url) {
      recordSource(state, {
        type: "calendar",
        title: e.title ?? "Event",
        url: e.html_url,
      });
    }
    return `- ${e.title ?? "Event"} | ${when}${e.location_name ? ` @ ${e.location_name}` : ""}${desc ? `\n  ${desc.slice(0, 300)}` : ""}`;
  });

  return {
    content: truncateForModel(
      `Calendar events (${events.length}):\n${lines.join("\n") || "(none)"}`
    ),
  };
}

async function toolGetFrontPage(
  state: AgentExecutorState,
  courseId: number
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  const page = await fetchCanvasJson<CanvasWikiPageBody>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/front_page`,
    state.accessToken
  );

  const body = sanitizeHtmlField(page.body);
  if (page.html_url) {
    recordSource(state, {
      type: "front_page",
      title: page.title ?? "Front page",
      url: page.html_url,
    });
  }

  return {
    content: truncateForModel(
      `Front page: ${page.title ?? "Home"}\n${body ?? "(empty)"}`
    ),
  };
}

interface CanvasSubmissionDetail {
  id?: number;
  score?: number | null;
  grade?: string | null;
  entered_score?: number | null;
  entered_grade?: string | null;
  excused?: boolean;
  late?: boolean;
  missing?: boolean;
  workflow_state?: string;
  submitted_at?: string | null;
  graded_at?: string | null;
  attempt?: number | null;
  submission_comments?: Array<{
    id?: number;
    comment?: string;
    author_name?: string;
    created_at?: string;
  }>;
}

async function toolGetAssignmentSubmission(
  state: AgentExecutorState,
  courseId: number,
  assignmentId: number
): Promise<ToolExecutionResult> {
  const denied = assertCourseAllowed(state, courseId);
  if (denied) return { content: denied, isError: true };

  if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
    return { content: "Invalid assignment_id.", isError: true };
  }

  const assignment = await fetchCanvasJson<CanvasAssignment>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/assignments/${assignmentId}`,
    state.accessToken
  );

  const sub = await fetchCanvasJson<CanvasSubmissionDetail>(
    state.baseUrl,
    `/api/v1/courses/${courseId}/assignments/${assignmentId}/submissions/self?include[]=submission_comments`,
    state.accessToken
  );

  if (assignment.html_url) {
    recordSource(state, {
      type: "assignment",
      title: assignment.name,
      url: assignment.html_url,
    });
  }

  const lines: string[] = [
    `Assignment: ${assignment.name}`,
    `Due: ${formatDueAt(assignment.due_at, state.timezone)}`,
    `Points possible: ${assignment.points_possible ?? "N/A"}`,
    `Status: ${sub.workflow_state ?? "unknown"}`,
  ];

  if (sub.excused) {
    lines.push("Score: excused");
  } else if (sub.score != null) {
    lines.push(`Score: ${sub.score}/${assignment.points_possible ?? "?"}`);
    if (sub.grade && sub.grade !== String(sub.score)) {
      lines.push(`Grade: ${sub.grade}`);
    }
  } else {
    lines.push("Score: not yet graded");
  }

  if (sub.late) lines.push("Late: yes");
  if (sub.missing) lines.push("Missing: yes");
  if (sub.submitted_at) {
    lines.push(`Submitted: ${formatDueAt(sub.submitted_at, state.timezone)}`);
  }
  if (sub.graded_at) {
    lines.push(`Graded: ${formatDueAt(sub.graded_at, state.timezone)}`);
  }
  if (sub.attempt != null) {
    lines.push(`Attempt: ${sub.attempt}`);
  }

  const comments = sub.submission_comments?.filter((c) => c.comment?.trim());
  if (comments && comments.length > 0) {
    lines.push("", "Comments:");
    for (const c of comments.slice(0, 10)) {
      const author = c.author_name ?? "Unknown";
      const date = c.created_at
        ? formatDueAt(c.created_at, state.timezone)
        : "";
      lines.push(`  - ${author}${date ? ` (${date})` : ""}: ${c.comment!.slice(0, 500)}`);
    }
  }

  return { content: truncateForModel(lines.join("\n")) };
}

async function toolGetGradesSummary(
  state: AgentExecutorState
): Promise<ToolExecutionResult> {
  const courses = await fetchCoursesWithGrades(
    state.baseUrl,
    state.accessToken,
    ["active"]
  );
  for (const c of courses) {
    state.activeCourseIds.add(c.id);
  }

  const grades = mapCourseGrades(courses);
  const lines = grades.map((g) => {
    if (g.hidden) return `- ${g.courseName}: hidden`;
    const score = g.currentScore != null ? `${g.currentScore}%` : "no score";
    const letter = g.currentGrade ? ` (${g.currentGrade})` : "";
    return `- ${g.courseName}: ${score}${letter}`;
  });

  let gpa = state.gpaSummary;
  if (!gpa && state.gpaPreferences) {
    const computed = calculateGpa(grades, state.gpaPreferences);
    gpa = {
      unweighted: computed.unweighted,
      weighted: computed.weighted,
      coursesIncluded: computed.coursesIncluded,
    };
    state.gpaSummary = gpa;
  }

  const gpaLines: string[] = [];
  if (gpa) {
    if (gpa.unweighted != null) {
      gpaLines.push(`Unweighted GPA (estimate): ${gpa.unweighted.toFixed(2)}`);
    }
    if (gpa.weighted != null) {
      gpaLines.push(`Weighted GPA (estimate): ${gpa.weighted.toFixed(2)}`);
    }
    gpaLines.push(`Courses in GPA: ${gpa.coursesIncluded}`);
  }

  return {
    content: truncateForModel(
      [
        ...(gpaLines.length ? ["GPA:", ...gpaLines, ""] : []),
        "Grades:",
        lines.join("\n") || "(none)",
      ].join("\n")
    ),
  };
}

interface CanvasPlannerItem {
  course_id?: number;
  plannable_type?: string;
  plannable?: { name?: string; title?: string; due_at?: string | null };
  html_url?: string;
}

async function toolListPlannerItems(
  state: AgentExecutorState,
  startDate: string,
  endDate?: string
): Promise<ToolExecutionResult> {
  const end = endDate?.trim() || startDate;
  const items = await fetchCanvasPaginated<CanvasPlannerItem>(
    state.baseUrl,
    `/api/v1/planner/items?start_date=${startDate}&end_date=${end}&per_page=100`,
    state.accessToken
  );

  const gradable = new Set(["assignment", "quiz"]);
  const filtered = items.filter((i) =>
    gradable.has((i.plannable_type ?? "").toLowerCase())
  );

  const lines = filtered.slice(0, MAX_LIST_ITEMS).map((i) => {
    const title =
      i.plannable?.name ?? i.plannable?.title ?? "Untitled";
    const due = i.plannable?.due_at
      ? formatDueAt(i.plannable.due_at, state.timezone)
      : "no due time";
    if (i.html_url) {
      recordSource(state, { type: "planner", title, url: i.html_url });
    }
    return `- ${title} (course ${i.course_id ?? "?"}) due ${due}`;
  });

  return {
    content: truncateForModel(
      `Planner ${startDate} to ${end} (${filtered.length} items):\n${lines.join("\n") || "(none)"}`
    ),
  };
}

export function createExecutorState(
  baseUrl: string,
  accessToken: string,
  timezone: string,
  gpaSummary: AgentExecutorState["gpaSummary"],
  gpaPreferences: GpaPreferences | null = null
): AgentExecutorState {
  const todayDate = getYmdInTimezone(new Date(), timezone);
  const tomorrowDate = getTomorrowYmd(timezone);
  const maxToolCalls =
    Number(process.env.CANVAS_AGENT_MAX_TOOL_CALLS) || 20;

  return {
    baseUrl,
    accessToken,
    timezone,
    todayDate,
    tomorrowDate,
    gpaSummary,
    gpaPreferences: gpaPreferences ?? DEFAULT_GPA_PREFERENCES,
    activeCourseIds: new Set(),
    sources: [],
    toolCallCount: 0,
    maxToolCalls,
  };
}

export async function executeCanvasTool(
  state: AgentExecutorState,
  toolName: string,
  toolInput: unknown
): Promise<ToolExecutionResult> {
  if (!CANVAS_AGENT_TOOL_NAMES.has(toolName)) {
    return { content: `Unknown tool: ${toolName}`, isError: true };
  }

  const limitErr = bumpToolCount(state);
  if (limitErr) {
    return { content: limitErr, isError: true };
  }

  const input =
    toolInput && typeof toolInput === "object"
      ? (toolInput as Record<string, unknown>)
      : {};

  try {
    switch (toolName) {
      case "list_active_courses":
        return await toolListActiveCourses(state);
      case "get_course_syllabus": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolGetCourseSyllabus(state, cid);
      }
      case "search_course": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolSearchCourse(
          state,
          cid,
          String(input.search_term ?? "")
        );
      }
      case "list_announcements": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolListAnnouncements(
          state,
          cid,
          input.limit != null ? Number(input.limit) : undefined
        );
      }
      case "list_assignments": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolListAssignments(state, cid, {
          search_term:
            input.search_term != null
              ? String(input.search_term)
              : undefined,
          due_on_or_after:
            input.due_on_or_after != null
              ? String(input.due_on_or_after)
              : undefined,
          due_on_or_before:
            input.due_on_or_before != null
              ? String(input.due_on_or_before)
              : undefined,
        });
      }
      case "list_modules": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolListModules(state, cid);
      }
      case "list_module_items": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolListModuleItems(
          state,
          cid,
          Number(input.module_id)
        );
      }
      case "list_pages": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolListPages(
          state,
          cid,
          input.search_term != null ? String(input.search_term) : undefined
        );
      }
      case "get_page": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolGetPage(
          state,
          cid,
          String(input.page_url ?? "")
        );
      }
      case "list_calendar_events": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolListCalendarEvents(
          state,
          cid,
          input.start_date != null ? String(input.start_date) : undefined,
          input.end_date != null ? String(input.end_date) : undefined
        );
      }
      case "get_front_page": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        return await toolGetFrontPage(state, cid);
      }
      case "get_assignment_submission": {
        const cid = parseCourseId(input.course_id);
        if (cid == null) return { content: "Invalid course_id.", isError: true };
        const aid = Number(input.assignment_id);
        if (!Number.isFinite(aid) || aid <= 0) return { content: "Invalid assignment_id.", isError: true };
        return await toolGetAssignmentSubmission(state, cid, aid);
      }
      case "get_grades_summary":
        return await toolGetGradesSummary(state);
      case "list_planner_items":
        return await toolListPlannerItems(
          state,
          String(input.start_date ?? ""),
          input.end_date != null ? String(input.end_date) : undefined
        );
      default:
        return { content: `Unhandled tool: ${toolName}`, isError: true };
    }
  } catch (err) {
    if (err instanceof CanvasApiError) {
      return {
        content: `Canvas API error (${err.status}): ${err.message}`,
        isError: true,
      };
    }
    const msg = err instanceof Error ? err.message : "Tool execution failed";
    return { content: msg, isError: true };
  }
}
