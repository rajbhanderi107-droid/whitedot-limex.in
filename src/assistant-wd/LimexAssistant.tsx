import { useEffect, useRef, useState, type FormEvent } from "react";
import { warmPublicBackend } from "../cinematic/publicApi";

/**
 * LIMEX Assistant — floating chat widget for the public site.
 *
 * Self-contained, removable module (see scripts/remove-assistant-wd.mjs).
 * Talks to POST /api/public/chat. Dark-mode, mineral brand voice, honors
 * prefers-reduced-motion and the VITE_WD_ASSISTANT_ENABLED kill switch.
 */

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:4000" : "https://api.whitedotindia.in");

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "I can help you evaluate LIMEX for plastic or paper replacement — applications, impact, and how to start a trial. What product or material are you working with?",
};

const SUGGESTIONS = [
  "What is LIMEX?",
  "Can it replace my plastic packaging?",
  "How do I start a trial?",
];

export function LimexAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  // Focus the input when the panel opens; also nudge the backend awake so
  // the first chat message doesn't wait on a Render cold start.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      warmPublicBackend();
    }
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError("");
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      // Send recent turns only (server caps at 20). Drop the local greeting.
      const history = next.filter((m, i) => !(i === 0 && m === GREETING)).slice(-18);
      const res = await fetch(`${API_BASE}/api/public/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || "The assistant could not respond. Please try again.");
      }
      setMessages((m) => [...m, { role: "assistant", content: json.data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <div className="wd-assistant">
      {/* Launcher */}
      <button
        type="button"
        className="wd-assistant-fab"
        aria-label={open ? "Close LIMEX assistant" : "Open LIMEX assistant"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.8-5.9A8.5 8.5 0 1 1 21 11.5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <section className="wd-assistant-panel" role="dialog" aria-label="LIMEX assistant">
          <header className="wd-assistant-head">
            <span className="wd-assistant-dot" aria-hidden="true" />
            <div>
              <strong>LIMEX Assistant</strong>
              <small>White Dot LLP · Authorized supply</small>
            </div>
          </header>

          <div className="wd-assistant-log" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`wd-assistant-msg wd-assistant-msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="wd-assistant-msg wd-assistant-msg-assistant wd-assistant-typing" aria-label="Assistant is typing">
                <span /><span /><span />
              </div>
            )}
            {error && <div className="wd-assistant-error" role="alert">{error}</div>}

            {messages.length === 1 && !loading && (
              <div className="wd-assistant-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>

          <form className="wd-assistant-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={2000}
              placeholder="Ask about LIMEX, applications, trials…"
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="Message"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 11l18-8-8 18-2-7-8-3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
          <p className="wd-assistant-disclaimer">
            Guidance only. Impact figures are approximate, product-specific examples.
          </p>
        </section>
      )}
    </div>
  );
}
