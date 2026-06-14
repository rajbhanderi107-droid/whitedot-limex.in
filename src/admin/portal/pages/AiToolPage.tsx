/* AiToolPage — generic, config-driven page for every AI Growth Studio tool.
 *
 * Renders the tool's input form from src/admin/portal/aiTools.ts, runs it
 * through the server (real Claude via /api/portal/ai/tool), and shows the
 * draft output with Copy + "Save to Approvals". Every output is a DRAFT for a
 * human to review — nothing is sent or published from here. */

import { useState } from "react";
import { Sparkles, Copy, Check, AlertTriangle, Loader2, BadgeCheck, ShieldAlert } from "lucide-react";
import { AI_TOOLS_BY_KEY, type AiTool } from "../aiTools.js";
import { portalApi, type AiToolResult } from "../portalApi.js";
import { usePortal } from "../PortalContext.js";
import { Card, SectionHeader, RiskBadge, type Risk } from "../ui.js";

const RISK_TO_APPROVAL: Record<NonNullable<AiTool["risk"]>, "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"> = {
  low: "LOW", medium: "MEDIUM", high: "HIGH",
};

export function AiToolPage({ moduleKey }: { moduleKey: string }) {
  const tool = AI_TOOLS_BY_KEY[moduleKey];
  const { lockdown } = usePortal();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!tool) {
    return (
      <div className="wd-page">
        <div className="wd-page-head"><h1>Tool not found</h1><p>No AI tool is registered under “{moduleKey}”.</p></div>
      </div>
    );
  }

  const Icon = tool.icon;
  const missingRequired = tool.fields.some((f) => f.required && !values[f.name]?.trim());

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));

  const run = async () => {
    setLoading(true); setError(null); setResult(null); setCopied(false); setSaved(false);
    try {
      const res = await portalApi.aiTool(tool.key, values);
      setResult(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The tool failed to run.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — ignore */ }
  };

  const saveToApprovals = async () => {
    if (!result) return;
    try {
      await portalApi.createApproval({
        title: `${tool.label} draft`,
        kind: tool.label,
        automationId: `tool:${tool.key}`,
        risk: tool.risk ? RISK_TO_APPROVAL[tool.risk] : "MEDIUM",
        preview: result.output.slice(0, 8000),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save to approvals.");
    }
  };

  return (
    <div className="wd-page">
      <div className="wd-page-head wd-page-head-mod">
        <div className="wd-mod-title">
          <span className="wd-mod-icon"><Icon size={20} /></span>
          <div>
            <h1>{tool.label} {tool.risk && <RiskBadge risk={tool.risk as Risk} />}</h1>
            <p>{tool.blurb}</p>
          </div>
        </div>
      </div>

      {tool.disclaimer && (
        <div className="wd-mod-lock" style={{ background: "rgba(220,160,40,.12)", borderColor: "rgba(220,160,40,.4)" }}>
          <AlertTriangle size={15} /> {tool.disclaimer}
        </div>
      )}

      <div className="wd-two-col wd-tool-layout">
        <Card>
          <SectionHeader title="Inputs" sub={tool.intro} />
          <form onSubmit={(e) => { e.preventDefault(); if (!missingRequired && !loading) run(); }}>
            {tool.fields.map((f) => (
              <label key={f.name} className="wd-field">
                <span>{f.label}{f.required && " *"}</span>
                {f.type === "textarea" ? (
                  <textarea rows={4} value={values[f.name] || ""} placeholder={f.placeholder}
                    onChange={(e) => set(f.name, e.target.value)} />
                ) : f.type === "select" ? (
                  <select value={values[f.name] || ""} onChange={(e) => set(f.name, e.target.value)}>
                    <option value="">Select…</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" value={values[f.name] || ""} placeholder={f.placeholder}
                    onChange={(e) => set(f.name, e.target.value)} />
                )}
              </label>
            ))}
            <button type="submit" className="wd-primary-btn" disabled={missingRequired || loading}>
              {loading ? <><Loader2 size={14} className="wd-spin" /> Running…</> : <><Sparkles size={14} /> {tool.cta}</>}
            </button>
          </form>
        </Card>

        <Card>
          <SectionHeader
            title="Output"
            sub="A draft for you to review and edit — nothing is sent or published."
            right={result ? (
              <div className="wd-tool-actions">
                <button className="wd-ghost-btn" onClick={copy}>{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}</button>
                <button className="wd-ghost-btn" onClick={saveToApprovals} disabled={saved}>
                  {saved ? <><Check size={13} /> Saved</> : <><BadgeCheck size={13} /> Save to Approvals</>}
                </button>
              </div>
            ) : undefined}
          />

          {lockdown && <div className="wd-mod-lock"><ShieldAlert size={14} /> Lockdown active — review drafts only; do not send externally until cleared.</div>}

          {!result && !error && !loading && (
            <p className="wd-muted">Fill in the inputs and run the tool. The result appears here as an editable draft.</p>
          )}
          {loading && <p className="wd-muted"><Loader2 size={14} className="wd-spin" /> Claude is working on your draft…</p>}
          {error && (
            <div className="wd-tool-error">
              <AlertTriangle size={15} /> {error}
            </div>
          )}
          {result && (
            <>
              <pre className="wd-tool-output">{result.output}</pre>
              <p className="wd-kpi-note wd-tool-meta">
                Model {result.model} · {result.inputTokens + result.outputTokens} tokens · ~${result.costUsd.toFixed(4)}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
