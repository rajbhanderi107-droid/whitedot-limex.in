/* The two things that decide a LIMEX sale, captured at the gate:
 * what the plant actually runs, and what happened to the samples. */

import { useState, type FormEvent } from "react";
import { FlaskConical, IndianRupee, Trash2, Factory, CheckCircle2, XCircle, CircleDashed, CircleSlash } from "lucide-react";
import { POLYMERS, PROCESSES, type MarkPatch, type RbMark, type RbStop, type RbSample, type SampleResult } from "./types.js";
import {
  num, polymersOf, processesOf, tonnesOf, resinRateOf, hasProfile, opportunity, inr, tonnesText,
  gradeFit, POLYMER_LABEL, PROCESS_LABEL, samplesOf, RESULT_LABEL, sampleStalled, sampleAge,
  fmtDate, today, addDays, FITLABEL,
} from "./logic.js";
import { patchMark, revertMark, addSample, setSampleResult, removeSample, useRb } from "./store.js";
import { toast } from "./ctx.js";

/* ─── fit profile ─── */

export function FitProfile({ s, m, onClose }: { s: RbStop; m?: RbMark; onClose: () => void }) {
  const st = useRb();
  const [polys, setPolys] = useState<string[]>(polymersOf(m));
  const [procs, setProcs] = useState<string[]>(processesOf(m));
  const [tonnes, setTonnes] = useState(tonnesOf(m)?.toString() ?? "");
  const [machines, setMachines] = useState(m?.machines?.toString() ?? "");
  const [filler, setFiller] = useState(m?.fillerPct?.toString() ?? "");
  const [rate, setRate] = useState(resinRateOf(m)?.toString() ?? "");
  const [thin, setThin] = useState(!!m?.thinWall);

  const toggle = (list: string[], setList: (v: string[]) => void, k: string) =>
    setList(list.includes(k) ? list.filter((x) => x !== k) : [...list, k]);

  const save = (e?: FormEvent) => {
    e?.preventDefault();
    const patch: MarkPatch = {
      polymers: polys.join(",") || null,
      processes: procs.join(",") || null,
      monthlyTonnes: tonnes === "" ? null : Number(tonnes),
      machines: machines === "" ? null : Number(machines),
      fillerPct: filler === "" ? null : Number(filler),
      resinRate: rate === "" ? null : Number(rate),
      thinWall: thin,
      profiledOn: today(),
    };
    const prev = patchMark(s.id, patch);
    toast(`${s.name} profiled`, () => revertMark(s.id, prev, patch));
    onClose();
  };

  // Show the sizing live as they type, so the value of answering is obvious.
  const preview = opportunity(
    { ...(m ?? {}), monthlyTonnes: tonnes === "" ? null : Number(tonnes), resinRate: rate === "" ? null : Number(rate) } as RbMark,
    st.settings,
  );

  return (
    <form className="rb-editor rb-fitform" onSubmit={save} data-testid="rb-fitform">
      <div className="rb-fit-head"><Factory size={13} /> What do they run?</div>

      <label className="rb-full">Polymers
        <div className="rb-chips">
          {POLYMERS.map((p) => (
            <button key={p} type="button" className="rb-chip" aria-pressed={polys.includes(p)}
              onClick={() => toggle(polys, setPolys, p)} title={POLYMER_LABEL[p]}>{p}</button>
          ))}
        </div>
      </label>

      <label className="rb-full">Process
        <div className="rb-chips">
          {PROCESSES.map((p) => (
            <button key={p} type="button" className="rb-chip" aria-pressed={procs.includes(p)}
              onClick={() => toggle(procs, setProcs, p)}>{PROCESS_LABEL[p]}</button>
          ))}
        </div>
      </label>

      <div className="rb-row">
        <label>Consumption <small>tonnes / month</small>
          <input type="number" min="0" step="0.5" inputMode="decimal" value={tonnes}
            onChange={(e) => setTonnes(e.target.value)} placeholder="e.g. 40" data-testid="rb-tonnes" />
        </label>
        <label>Machines
          <input type="number" min="0" step="1" inputMode="numeric" value={machines}
            onChange={(e) => setMachines(e.target.value)} placeholder="e.g. 12" />
        </label>
      </div>

      <div className="rb-row">
        <label>Filler today <small>%</small>
          <input type="number" min="0" max="100" step="1" inputMode="numeric" value={filler}
            onChange={(e) => setFiller(e.target.value)} placeholder="0" />
        </label>
        <label>Resin rate <small>₹ / kg they pay now</small>
          <input type="number" min="0" step="0.5" inputMode="decimal" value={rate}
            onChange={(e) => setRate(e.target.value)} placeholder="e.g. 96" />
        </label>
      </div>

      <label className="rb-check">
        <input type="checkbox" checked={thin} onChange={(e) => setThin(e.target.checked)} />
        Thin-wall work <small>— caps how much filler they can take</small>
      </label>

      {preview.known && (
        <div className="rb-sizing" data-testid="rb-sizing">
          <span><b>{tonnesText(preview.tonnes)}</b> of LIMEX at {st.settings?.substitutionPct ?? 30}%</span>
          {preview.value !== null
            ? <span><b>{inr(preview.value)}</b> a month</span>
            : <span className="rb-sizing-hint">Set your LIMEX rate to see this in rupees</span>}
          {preview.saving !== null && preview.saving > 0 && <span className="rb-sizing-save">saves them {inr(preview.saving)}/mo</span>}
        </div>
      )}

      <div className="rb-editor-acts">
        <button type="submit" className="wd-primary-btn" data-testid="rb-fit-save">Save profile</button>
        <button type="button" className="wd-ghost-btn" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

/** The one-line read-out that sits on the card once a plant is profiled. */
export function FitSummary({ s, m }: { s: RbStop; m?: RbMark }) {
  const st = useRb();
  if (!hasProfile(m)) return null;
  const g = gradeFit(s, m);
  const opp = opportunity(m, st.settings);
  const polys = polymersOf(m), procs = processesOf(m);
  return (
    <div className="rb-fitsum" data-testid="rb-fitsum">
      <span className={`rb-pill rb-fit-${g.fit}`} title={g.why.join(" · ")}>{FITLABEL[g.fit]}</span>
      {polys.length > 0 && <span className="rb-fitbit">{polys.join(" / ")}</span>}
      {procs.length > 0 && <span className="rb-fitbit">{procs.map((p) => PROCESS_LABEL[p] ?? p).join(", ")}</span>}
      {opp.known && <span className="rb-fitbit rb-fitvol">{tonnesText(opp.tonnes)}</span>}
      {opp.value !== null && <span className="rb-fitbit rb-fitmoney"><IndianRupee size={10} />{inr(opp.value).replace("₹", "")}/mo</span>}
      {m?.fillerPct != null && m.fillerPct > 0 && <span className="rb-fitbit">{m.fillerPct}% filler now</span>}
    </div>
  );
}

/* ─── samples ─── */

const RESULT_ICON: Record<SampleResult, typeof CheckCircle2> = {
  PENDING: CircleDashed, PASS: CheckCircle2, PARTIAL: CircleSlash, FAIL: XCircle,
};

export function SamplePanel({ s, m, onClose }: { s: RbStop; m?: RbMark; onClose: () => void }) {
  const rows = samplesOf(m);
  const [grade, setGrade] = useState("");
  const [kg, setKg] = useState("");
  const [who, setWho] = useState(m?.contactName ?? "");
  const [due, setDue] = useState(addDays(today(), 14));
  const [busy, setBusy] = useState(false);

  const add = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!grade.trim() || kg === "") { toast("Grade and weight are needed"); return; }
    setBusy(true);
    try {
      await addSample(s.id, { grade: grade.trim(), kg: Number(kg), contactName: who.trim() || null, trialDueOn: due || null });
      toast(`${kg} kg of ${grade.trim()} logged to ${s.name}`);
      setGrade(""); setKg("");
    } catch (err) { toast(err instanceof Error ? err.message : "Could not record the sample", undefined, "err"); }
    finally { setBusy(false); }
  };

  return (
    <div className="rb-editor rb-samplepanel" data-testid="rb-samplepanel">
      <div className="rb-fit-head"><FlaskConical size={13} /> Samples</div>

      {rows.length > 0 && (
        <div className="rb-samplelist">
          {rows.map((x) => <SampleRow key={x.id} stopId={s.id} x={x} />)}
        </div>
      )}

      <form className="rb-sampleadd" onSubmit={add}>
        <div className="rb-row">
          <label>Grade<input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="LIMEX PP-50" maxLength={80} data-testid="rb-sample-grade" /></label>
          <label>Weight <small>kg</small><input type="number" min="0" step="0.5" inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="5" data-testid="rb-sample-kg" /></label>
        </div>
        <div className="rb-row">
          <label>Given to<input value={who} onChange={(e) => setWho(e.target.value)} placeholder="Who took it" maxLength={200} /></label>
          <label>Trial by<input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></label>
        </div>
        <div className="rb-editor-acts">
          <button type="submit" className="wd-primary-btn" disabled={busy} data-testid="rb-sample-add">{busy ? "Saving…" : "Log sample"}</button>
          <button type="button" className="wd-ghost-btn" onClick={onClose}>Close</button>
        </div>
      </form>
    </div>
  );
}

function SampleRow({ stopId, x }: { stopId: string; x: RbSample }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(x.resultNote ?? "");
  const Icon = RESULT_ICON[x.result];
  const stalled = sampleStalled(x);

  const mark = async (result: SampleResult) => {
    try {
      await setSampleResult(stopId, x.id, { result, resultOn: today(), resultNote: note.trim() || null });
      toast(result === "PENDING" ? "Back to awaiting trial" : `Trial marked ${RESULT_LABEL[result].toLowerCase()}`);
      setOpen(false);
    } catch (e) { toast(e instanceof Error ? e.message : "Could not save", undefined, "err"); }
  };
  const drop = async () => {
    try { await removeSample(stopId, x.id); toast("Sample removed"); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not remove", undefined, "err"); }
  };

  return (
    <div className={`rb-samplerow rb-res-${x.result.toLowerCase()}${stalled ? " is-stalled" : ""}`} data-testid="rb-samplerow">
      <span className="rb-sampleicon"><Icon size={15} /></span>
      <span className="rb-samplemain">
        <b>{num(x.kg)} kg · {x.grade}</b>
        <em>
          {fmtDate(x.givenOn)}{x.contactName ? ` · ${x.contactName}` : ""}
          {x.result === "PENDING"
            ? x.trialDueOn ? ` · trial by ${fmtDate(x.trialDueOn)}` : ` · ${sampleAge(x)} days out`
            : x.resultOn ? ` · ${RESULT_LABEL[x.result]} ${fmtDate(x.resultOn)}` : ` · ${RESULT_LABEL[x.result]}`}
        </em>
        {x.resultNote && <span className="rb-dnote">{x.resultNote}</span>}
        {stalled && <span className="rb-stalled">No trial result — worth a chase</span>}
      </span>
      <span className="rb-sampleacts">
        {!open && <button type="button" className="wd-ghost-btn" onClick={() => setOpen(true)} data-testid="rb-sample-result">Result</button>}
        <button type="button" className="rb-mini" onClick={drop} aria-label="Remove sample"><Trash2 size={11} /></button>
      </span>
      {open && (
        <div className="rb-sampleresult">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What came back — loading, cycle, finish…" maxLength={2000} />
          <div className="rb-chips">
            {(["PASS", "PARTIAL", "FAIL", "PENDING"] as SampleResult[]).map((r) => (
              <button key={r} type="button" className="rb-chip" onClick={() => mark(r)} data-testid={`rb-res-${r}`}>{RESULT_LABEL[r]}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
