"use client";

import ChatMarkdown from "@/components/assistant/ChatMarkdown";
import Alert from "@/components/ui/Alert";
import {
  ArrowUp,
  Bot,
  Loader2,
  Sparkles,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const EXAMPLE_PROMPTS = [
  "When is my chem project due?",
  "What do I have due tomorrow?",
  "What is my English syllabus?",
  "When is my calculus potluck?",
  "Which class has my lowest grade?",
];

interface CanvasSource {
  type: string;
  title: string;
  url: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: CanvasSource[];
}

export default function AssignmentAssistant({
  fullPage = false,
}: {
  fullPage?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  function resizeTextarea() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setError(null);
    setLoading(true);
    const prior = messages;
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

    const history = prior.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Timezone": timezone,
        },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const body = await res.json();

      if (!res.ok) {
        const errMsg = body.message ?? "Could not get an answer. Try again.";
        if (body.error === "off_topic") {
          setMessages([
            ...nextMessages,
            {
              role: "assistant",
              content: errMsg,
            },
          ]);
        } else {
          setError(errMsg);
          setMessages(prior);
        }
        return;
      }

      const sources = Array.isArray(body.sources)
        ? (body.sources as CanvasSource[])
        : undefined;

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: body.answer as string,
          sources,
        },
      ]);
    } catch {
      setError("Network error. Check your connection and try again.");
      setMessages(prior);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  }

  const shellClass = fullPage
    ? "cb-chat-shell cb-chat-shell--full"
    : "cb-card cb-chat-shell flex flex-col overflow-hidden max-h-[32rem]";

  return (
    <section className={shellClass} aria-label="Canvas AI assistant">
      {fullPage && (
        <header className="cb-chat-topbar shrink-0">
          <div className="cb-chat-topbar-inner">
            <Sparkles
              className="h-5 w-5 shrink-0 text-[var(--color-canvas-red)]"
              strokeWidth={2.25}
              aria-hidden
            />
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">
                Canvas assistant
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Searches syllabus, announcements, modules, and assignments
              </p>
            </div>
          </div>
        </header>
      )}

      {!fullPage && (
        <header className="shrink-0 border-b border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles
              className="h-5 w-5 text-[var(--color-canvas-red)]"
              strokeWidth={2.25}
              aria-hidden
            />
            <h2 className="text-base font-bold text-[var(--color-text)]">
              Assignment assistant
            </h2>
          </div>
        </header>
      )}

      <div ref={scrollRef} className="cb-chat-scroll min-h-0 flex-1 overflow-y-auto">
        <div className="cb-chat-thread">
          {messages.length === 0 && !loading && (
            <div className="cb-chat-empty">
              <div className="cb-chat-empty-icon" aria-hidden>
                <Bot className="h-8 w-8 text-[var(--color-canvas-red)]" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">
                What can I help you find in Canvas?
              </h3>
              <p className="mt-2 max-w-md text-center text-sm text-[var(--color-text-muted)]">
                Ask about syllabi, due dates, announcements, grades, or anything
                in your courses. I search live Canvas data for each question.
              </p>
              <div className="mt-8 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading}
                    onClick={() => ask(prompt)}
                    className="cb-chat-suggestion cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--color-canvas-red)] hover:shadow-[var(--shadow-clay-sm)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={
                msg.role === "user"
                  ? "cb-chat-row cb-chat-row--user"
                  : "cb-chat-row cb-chat-row--assistant"
              }
            >
              <div
                className={
                  msg.role === "user"
                    ? "cb-chat-avatar cb-chat-avatar--user"
                    : "cb-chat-avatar cb-chat-avatar--bot"
                }
                aria-hidden
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <Bot className="h-4 w-4" strokeWidth={2.25} />
                )}
              </div>
              <div className="cb-chat-bubble-wrap min-w-0 flex-1">
                <p className="cb-chat-role-label sr-only">
                  {msg.role === "user" ? "You" : "Assistant"}
                </p>
                {msg.role === "user" ? (
                  <div className="cb-chat-bubble cb-chat-bubble--user">
                    <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                ) : (
                  <div className="cb-chat-bubble cb-chat-bubble--assistant">
                    <ChatMarkdown content={msg.content} />
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="cb-chat-sources">
                        <p className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                          Sources
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {msg.sources.map((s, j) => (
                            <li key={`${s.url}-${j}`}>
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cb-chat-link text-sm font-medium"
                              >
                                {s.title}
                              </a>
                              <span className="text-xs text-[var(--color-text-muted)]">
                                {" "}
                                · {s.type}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="cb-chat-row cb-chat-row--assistant">
              <div className="cb-chat-avatar cb-chat-avatar--bot" aria-hidden>
                <Bot className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="cb-chat-bubble cb-chat-bubble--assistant flex items-center gap-2 py-3">
                <Loader2
                  className="h-4 w-4 animate-spin text-[var(--color-canvas-red)]"
                  aria-hidden
                />
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Searching Canvas…
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-4 pb-2">
          <div className="mx-auto max-w-3xl">
            <Alert>{error}</Alert>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="cb-chat-composer shrink-0"
      >
        <div className="cb-chat-composer-inner">
          <label htmlFor="assistant-input" className="sr-only">
            Message Canvas assistant
          </label>
          <textarea
            id="assistant-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message Canvas assistant…"
            disabled={loading}
            className="cb-chat-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="cb-chat-send"
            aria-label={loading ? "Searching" : "Send message"}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <ArrowUp className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            )}
          </button>
        </div>
        <p className="cb-chat-composer-hint">
          Enter to send · Shift+Enter for new line · AI-generated (Anthropic) —
          may be inaccurate; verify against Canvas
        </p>
      </form>
    </section>
  );
}
