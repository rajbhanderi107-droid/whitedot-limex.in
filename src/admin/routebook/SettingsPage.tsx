/* Settings — everything in the sales books that is configured rather than
 * done, in one place: selling figures, route start, list preferences, saved
 * views, data exports, the phone apps, and (for admins) the register and the
 * portal controls that used to sit in the sales top bar. */

import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Settings as SettingsIcon, Percent, MapPin, Rows3, Bookmark, Trash2, Download, Phone, Upload, Smartphone,
  Database, RefreshCw, ShieldAlert, Sparkles, Globe, Users,
} from "lucide-react";
import { useBook, OpenAsApp } from "./BookBits.js";
import { BookShell } from "./BookBits.js";
import { saveSettings, setPrefs, deleteView, reseed, load } from "./store.js";
import { toast } from "./ctx.js";
import { ResearchAdditions } from "./ResearchAdditions.js";
import { RegionSwitch } from "./RegionSwitch.js";
import { backupBook, exportContactsVcf, exportWholeBookCSV, getHome, restoreFromFile, setHome } from "./bookData.js";
import { usePortal, AUTOMATION_MODES, type AutomationMode } from "../portal/PortalContext.js";

export function SettingsPage() {
  const st = useBook();
  const admin = !!st.me && ["SUPER_ADMIN", "ADMIN"].includes(st.me.role);
  const superAdmin = st.me?.role === "SUPER_ADMIN";
  const fileRef = useRef<HTMLInputElement>(null);
  const density = st.prefs.density ?? "cozy";

  return (
    <BookShell st={st} icon={<SettingsIcon size={20} />} title="Settings" sub="Everything you set up once for the books" testId="book-settings">
      <div className="st-grid">
        <section className="st-sec" aria-labelledby="st-selling">
          <h2 id="st-selling"><Percent size={16} /> Selling</h2>
          <div className="st-row">
            <div><b>Region</b><p>India shows the Gujarat and India register; Canada shows the partner's Canadian makers and importers, with its own products.</p></div>
            <RegionSwitch />
          </div>
          <RateBox />
          <HomeBox />
        </section>

        <section className="st-sec" aria-labelledby="st-lists">
          <h2 id="st-lists"><Rows3 size={16} /> Lists</h2>
          <div className="st-row">
            <div><b>Density</b><p>Compact fits more companies on a screen.</p></div>
            <div className="st-seg" role="group" aria-label="Density">
              {(["cozy", "compact"] as const).map((d) => (
                <button key={d} type="button" aria-pressed={density === d} onClick={() => setPrefs({ density: d })}>{d === "cozy" ? "Cozy" : "Compact"}</button>
              ))}
            </div>
          </div>
          <div className="st-row st-col">
            <div><b><Bookmark size={13} /> Saved team views</b><p>Save a view from Companies with the Views menu; apply it there too.</p></div>
            {st.views.length ? (
              <ul className="st-list">
                {st.views.map((v) => (
                  <li key={v.id}><span>{v.name}<small>{v.createdBy?.name?.split(" ")[0]}</small></span>
                    <button type="button" className="wd-icon-btn" aria-label={`Delete view ${v.name}`}
                      onClick={() => deleteView(v.id).then(() => toast("View deleted")).catch(() => toast("Only the creator or an admin can delete this view", undefined, "err"))}>
                      <Trash2 size={14} />
                    </button></li>
                ))}
              </ul>
            ) : <p className="st-empty">No saved views yet.</p>}
          </div>
        </section>

        <section className="st-sec" aria-labelledby="st-data">
          <h2 id="st-data"><Database size={16} /> Data</h2>
          <div className="st-actions">
            <button type="button" className="wd-ghost-btn" onClick={exportWholeBookCSV}><Download size={13} /> Whole book (CSV)</button>
            <button type="button" className="wd-ghost-btn" onClick={exportContactsVcf}><Phone size={13} /> Contacts (.vcf)</button>
            <button type="button" className="wd-ghost-btn" onClick={backupBook}><Download size={13} /> Back up everything</button>
            <button type="button" className="wd-ghost-btn" onClick={() => fileRef.current?.click()}><Upload size={13} /> Restore or import</button>
            <button type="button" className="wd-ghost-btn" onClick={() => load(true)}><RefreshCw size={13} /> Reload from the server</button>
          </div>
          <p className="st-note">Visits, Leads and Customers each export their own Excel and Word files from their ⋯ menu.</p>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void restoreFromFile(f); e.target.value = ""; }} />
        </section>

        <section className="st-sec" aria-labelledby="st-apps">
          <h2 id="st-apps"><Smartphone size={16} /> Phone apps</h2>
          <p className="st-note">Open a book as its own app, then use your browser's “Add to Home screen”.</p>
          <div className="st-actions">
            <OpenAsApp dir="route" label="Route Book" named />
            <OpenAsApp dir="visits" label="Visit Follow-ups" named />
            <OpenAsApp dir="leads" label="Lead Book" named />
            <OpenAsApp dir="customers" label="Customer Book" named />
          </div>
        </section>

        {admin && (
          <section className="st-sec" aria-labelledby="st-register">
            <h2 id="st-register"><RefreshCw size={16} /> Register <span className="st-badge">admin</span></h2>
            <div className="st-row">
              <div><b>Refresh register data</b><p>Loads the latest company register. Every tick, note and outcome is kept.</p></div>
              <button type="button" className="wd-ghost-btn" onClick={async () => {
                if (!window.confirm("Refresh the register data from the shipped dataset? Every tick, note and outcome is kept.")) return;
                try { const r = await reseed(); toast(`Register refreshed — ${r.stops} companies`); } catch (e) { toast(e instanceof Error ? e.message : "Reseed failed", undefined, "err"); }
              }}>Refresh</button>
            </div>
            <ResearchAdditions />
          </section>
        )}

        {admin && <PortalAdmin superAdmin={superAdmin} />}
      </div>
    </BookShell>
  );
}

/** The share of a plant's resin LIMEX is sized to replace. Every tonne
 *  figure in the book derives from it. The books show no rupee figures. */
export function RateBox() {
  const st = useBook();
  const admin = !!st.me && ["SUPER_ADMIN", "ADMIN"].includes(st.me.role);
  const saved = (st.settings?.substitutionPct ?? 30).toString();
  const [pct, setPct] = useState(saved);
  const [busy, setBusy] = useState(false);
  const dirty = pct !== saved;

  const save = async () => {
    setBusy(true);
    try { await saveSettings({ substitutionPct: Number(pct) }); toast("Sizing updated across the book"); }
    catch (e) { toast(e instanceof Error ? e.message : "Could not save", undefined, "err"); }
    finally { setBusy(false); }
  };

  if (!admin) {
    return <p className="rb-rail-note" data-testid="rb-ratebox">Sizing at {st.settings?.substitutionPct ?? 30}% substitution of each plant's resin.</p>;
  }
  return (
    <div className="rb-ratebox" data-testid="rb-ratebox">
      <label>Substitution <small>% of their resin volume</small>
        <input type="number" min="0" max="100" step="5" inputMode="numeric" value={pct}
          onChange={(e) => setPct(e.target.value)} data-testid="rb-pct" />
      </label>
      {dirty && <button type="button" className="wd-primary-btn" onClick={save} disabled={busy} data-testid="rb-rate-save">{busy ? "Saving…" : "Apply"}</button>}
      <p className="rb-rail-note">Every tonne figure in the book comes from this.</p>
    </div>
  );
}

function HomeBox() {
  const [home, setH] = useState(getHome);
  const [draft, setDraft] = useState(home);
  return (
    <div className="st-row">
      <div><b><MapPin size={13} /> Route start point</b><p>Where Google Maps routes begin. Kept on this device.</p></div>
      <form className="st-inline" onSubmit={(e) => { e.preventDefault(); const h = setHome(draft); setH(h); setDraft(h); toast("Start point saved"); }}>
        <input aria-label="Route start point" value={draft} onChange={(e) => setDraft(e.target.value)} />
        {draft !== home && <button type="submit" className="wd-primary-btn">Save</button>}
      </form>
    </div>
  );
}

/** The portal controls that do not belong in a sales top bar. */
function PortalAdmin({ superAdmin }: { superAdmin: boolean }) {
  const { automationMode, setAutomationMode, emergencyStop, triggerEmergencyStop, clearEmergencyStop } = usePortal();
  const onEmergency = () => {
    if (emergencyStop) {
      if (window.confirm("Clear emergency stop and resume normal operation (Approval mode)?")) clearEmergencyStop();
    } else if (window.confirm("EMERGENCY STOP\n\nThis pauses all automations, disables Auto mode, stops external sending and campaigns, and puts the portal into Lockdown.\n\nProceed?")) {
      triggerEmergencyStop();
    }
  };
  return (
    <section className="st-sec" aria-labelledby="st-admin">
      <h2 id="st-admin"><ShieldAlert size={16} /> Portal <span className="st-badge">admin</span></h2>
      <div className="st-row">
        <div><b><Sparkles size={13} /> Automation mode</b><p>Default for portal automations.</p></div>
        <select aria-label="Automation mode" value={automationMode} onChange={(e) => setAutomationMode(e.target.value as AutomationMode)}>
          {AUTOMATION_MODES.map((m) => <option key={m.mode} value={m.mode}>{m.label}</option>)}
        </select>
      </div>
      <div className="st-row">
        <div><b>Emergency stop</b><p>Pauses automations and external sending.</p></div>
        <button type="button" className={`wd-ghost-btn st-danger${emergencyStop ? " is-on" : ""}`} onClick={onEmergency}>
          <ShieldAlert size={13} /> {emergencyStop ? "Locked — clear" : "Stop"}
        </button>
      </div>
      <div className="st-actions">
        <Link className="wd-ghost-btn" to="/admin/settings"><Globe size={13} /> Website settings</Link>
        {superAdmin && <Link className="wd-ghost-btn" to="/admin/users"><Users size={13} /> Manage users</Link>}
      </div>
    </section>
  );
}

export default SettingsPage;
