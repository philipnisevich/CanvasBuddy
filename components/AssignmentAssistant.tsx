"use client";

import { useState } from "react";

const EXAMPLE_PROMPTS = [
  "When is my chem project due?",
  "What do I have due tomorrow?",
  "Look at my English assignment due tomorrow and give me an outline for how to do it.",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AssignmentAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Timezone": timezone,
        },
        body: JSON.stringify({ message: trimmed }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body.message ?? "Could not get an answer. Try again.");
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: body.answer as string },
      ]);
    } catch {
      setError("Network error. Check your connection and try again.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="border-b border-[var(--border)] bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
        <h2 className="text-lg font-semibold">Assignment assistant</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Ask about due dates, what&apos;s coming up, or how to approach an
          assignment. Answers use your live Canvas data.
        </p>
      </div>

      {messages.length > 0 && (
        <ul className="max-h-96 space-y-4 overflow-y-auto px-4 py-4">
          {messages.map((msg, i) => (
            <li
              key={`${msg.role}-${i}`}
              className={
                msg.role === "user"
                  ? "ml-8 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm text-white"
                  : "mr-4 rounded-lg border border-[var(--border)] bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/50"
              }
            >
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide opacity-70">
                {msg.role === "user" ? "You" : "CanvasBuddy"}
              </span>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </li>
          ))}
          {loading && (
            <li className="mr-4 text-sm text-[var(--muted)] animate-pulse">
              Thinking…
            </li>
          )}
        </ul>
      )}

      {error && (
        <p
          role="alert"
          className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
        >
          {error}
        </p>
      )}

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 px-4 pt-4">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={loading}
              onClick={() => ask(prompt)}
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-left text-xs transition hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 border-t border-[var(--border)] p-4 sm:flex-row"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Ask about your assignments
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. When is my chem project due?"
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
