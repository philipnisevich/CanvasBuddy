import type Anthropic from "@anthropic-ai/sdk";

export const CANVAS_AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_active_courses",
    description:
      "List the student's active Canvas courses (id, name, course code). Call this first when you need to identify which course the student means.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "get_course_syllabus",
    description:
      "Get the official syllabus body configured on a course (HTML stripped to text). Use after resolving course_id.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: {
          type: "number",
          description: "Canvas course id from list_active_courses",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "search_course",
    description:
      "Search within one course across announcements, assignments, pages, modules, files, etc. Best for keyword questions (e.g. potluck, exam 2).",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        search_term: {
          type: "string",
          description: "Keywords to search for (2+ characters)",
        },
      },
      required: ["course_id", "search_term"],
    },
  },
  {
    name: "list_announcements",
    description:
      "List recent course announcements (discussion topics marked as announcements).",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        limit: {
          type: "number",
          description: "Max items to return (default 15, max 30)",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "list_assignments",
    description:
      "List assignments/quizzes in a course with due dates and submission status. Optional search_term filters by title.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        search_term: { type: "string" },
        due_on_or_after: {
          type: "string",
          description: "Calendar date yyyy-mm-dd (student timezone)",
        },
        due_on_or_before: {
          type: "string",
          description: "Calendar date yyyy-mm-dd (student timezone)",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "list_modules",
    description: "List module names and ids for a course.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
      },
      required: ["course_id"],
    },
  },
  {
    name: "list_module_items",
    description: "List items inside a specific module (pages, assignments, files, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        module_id: { type: "number" },
      },
      required: ["course_id", "module_id"],
    },
  },
  {
    name: "list_pages",
    description: "List wiki page titles and urls for a course.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        search_term: {
          type: "string",
          description: "Optional filter on page title/url",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "get_page",
    description:
      "Get full body of a wiki page by url slug (from list_pages). Use for syllabus pages not in course syllabus field.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        page_url: { type: "string", description: "Page url slug from list_pages" },
      },
      required: ["course_id", "page_url"],
    },
  },
  {
    name: "list_calendar_events",
    description:
      "List calendar events for a course (non-assignment events, office hours, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
        start_date: {
          type: "string",
          description: "ISO8601 start (defaults to 30 days ago)",
        },
        end_date: {
          type: "string",
          description: "ISO8601 end (defaults to 120 days ahead)",
        },
      },
      required: ["course_id"],
    },
  },
  {
    name: "get_front_page",
    description: "Get the course front/home wiki page content.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number" },
      },
      required: ["course_id"],
    },
  },
  {
    name: "get_assignment_submission",
    description:
      "Get the student's grade/score and submission details for a single assignment. Returns score, points_possible, grade, late/missing flags, submitted_at, and grader comments. Use after identifying the assignment_id from list_assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        course_id: { type: "number", description: "Canvas course id" },
        assignment_id: {
          type: "number",
          description: "Canvas assignment id (from list_assignments)",
        },
      },
      required: ["course_id", "assignment_id"],
    },
  },
  {
    name: "get_grades_summary",
    description:
      "Current grades for all active courses plus GPA estimate. Use for grade comparisons without fetching every assignment.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "list_planner_items",
    description:
      "Planner items (assignments/quizzes) for a calendar date range. Use for what is due tomorrow or on a specific day.",
    input_schema: {
      type: "object" as const,
      properties: {
        start_date: {
          type: "string",
          description: "yyyy-mm-dd inclusive",
        },
        end_date: {
          type: "string",
          description: "yyyy-mm-dd inclusive (defaults to start_date)",
        },
      },
      required: ["start_date"],
    },
  },
];

export const CANVAS_AGENT_TOOL_NAMES = new Set(
  CANVAS_AGENT_TOOLS.map((t) => t.name)
);
