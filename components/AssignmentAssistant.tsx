"use client";

import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import Alert from "@/components/ui/Alert";

const EXAMPLE_PROMPTS = [
  "When is my chem project due?",
  "What do I have due tomorrow?",
  "Outline my English assignment due tomorrow.",
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
    <section className="cb-card flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--accent-soft)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-5 w-5 text-[var(--color-canvas-red)]"
            strokeWidth={2.25}
            aria-hidden
          />
          <h2 className="text-lg font-bold text-[var(--color-text)]">
            Assignment assistant
          </h2>
        </div>
        <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
          Ask about due dates, what&apos;s coming up, or how to break down an
          assignment. Answers use your live Canvas data.
        </p>
      </header>

      <div className="min-h-0 flex-1">
        {messages.length > 0 && (
          <ul className="max-h-[28rem] space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <li
                key={`${msg.role}-${i}`}
                className={
                  msg.role === "user"
                    ? "ml-6 rounded-[var(--radius-lg)] border border-[var(--color-canvas-red-dark)] bg-[var(--color-canvas-red)] px-3 py-2.5 text-sm font-medium text-white"
                    : "mr-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card-muted)] px-3 py-2.5 text-sm text-[var(--color-text)]"
                }
              >
                <span
                  className={`mb-1 flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider ${
                    msg.role === "user"
                      ? "text-white/80"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {msg.role === "user" ? (
                    "You"
                  ) : (
                    <>
                      <MessageCircle className="h-3 w-3" aria-hidden />
                      Assistant
                    </>
                  )}
                </span>
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </li>
            ))}
            {loading && (
              <li className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
                <Loader2
                  className="h-4 w-4 animate-spin text-[var(--color-canvas-red)]"
                  aria-hidden
                />
                Thinking…
              </li>
            )}
          </ul>
        )}

        {error && (
          <div className="px-4 pb-2">
            <Alert>{error}</Alert>
          </div>
        )}

        {messages.length === 0 && (
          <div className="px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
              Try asking:
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={loading}
                  onClick={() => ask(prompt)}
                  className="cursor-pointer rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left text-sm font-medium text-[var(--color-text)] transition-[border-color,background-color] duration-200 hover:border-[var(--color-canvas-red)] hover:bg-[var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[var(--border)] bg-[var(--card-muted)] p-4"
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
          className="cb-input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="cb-btn-primary mt-2 w-full py-2.5"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
