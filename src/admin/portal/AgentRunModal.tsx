/* AgentRunModal — run any registry agent against Claude and show the draft.
 *
 * The draft is editable and copyable; nothing is sent or published from here.
 * Shows the model used, token usage and per-run cost so spend is visible. */

import { useEffect, useRef, useState } from "react";
import { X, Sparkles, Copy, Check, Loader2 } from "lucide-react";
import { portalApi, type AgentRunResult } from "./portalApi.js";

interface Props {
  agentId: string;
  agentName: string;
  role: string;
  onClose: () => void;
}

export function AgentRunModal({ agentId, agentName, role, onClose }: Props) {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentRunResult | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run() {
    if (!input.trim() || running) return;
    setRunning(true);
    setError(null);
    try {
      const r = await portalApi.runAiAgent(agentId, {
        input: input.trim(),
        context: context.trim() || undefined,
      });
      setResult(r.data);
      setDraft(r.data.output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The agent run failed. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="wd-modal-overlay" onClick={onClose}>
      <div className="wd-modal" role="dialog" aria-modal="true" aria-label={`Run ${agentName}`} onClick={(e) => e.stopPropagation()}>
        <div className="wd-modal-head">
          <div>
            <h2><Sparkles size={16} /> {agentName}</h2>
            <p>{role}</p>
          </div>
          <button className="wd-modal-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="wd-modal-body">
          <label className="wd-modal-label" htmlFor="wd-agent-input">Task for the agent</label>
          <textarea
            id="wd-agent-input"
            ref={inputRef}
            className="wd-modal-textarea"
            rows={4}
            placeholder="e.g. Write 3 LinkedIn ad headlines for LIMEX packaging targeting FMCG brands in Gujarat."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
          />

          {showContext ? (
            <>
              <label className="wd-modal-label" htmlFor="wd-agent-context">Context (optional)</label>
              <textarea
                id="wd-agent-context"
                className="wd-modal-textarea"
                rows={3}
                placeholder="Paste any data, brief or lead notes the agent should ground its draft in."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </>
          ) : (
            <button className="wd-modal-link" onClick={() => setShowContext(true)}>+ Add context</button>
          )}

          {error && <div className="wd-modal-error">{error}</div>}

          {result && (
            <div className="wd-modal-result">
              <div className="wd-modal-result-head">
                <span>Draft</span>
                <button className="wd-modal-copy" onClick={copy}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
              <textarea
                className="wd-modal-textarea wd-modal-output"
                rows={10}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="wd-modal-meta">
                <span>{result.model}</span>
                <span>{result.inputTokens + result.outputTokens} tokens</span>
                <span>${result.costUsd.toFixed(4)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="wd-modal-foot">
          <span className="wd-modal-hint">Draft only — review &amp; edit before using. ⌘/Ctrl+Enter to run.</span>
          <button className="wd-modal-run" onClick={run} disabled={running || !input.trim()}>
            {running ? <><Loader2 size={14} className="wd-spin" /> Running…</> : <><Sparkles size={14} /> {result ? "Run again" : "Run agent"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
