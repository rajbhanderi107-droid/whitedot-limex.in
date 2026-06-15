/* AttendanceBoard — live digital-office attendance for admins.
 *
 * ADMIN+ see the punch board (who's in / out / hours / status).
 * SUPER_ADMIN additionally sees employee location: last known position,
 * a live map, and the full day trail. Location is never shown to other roles.
 * Backed by the real attendance/location API (not localStorage). */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, MapPin, Clock, UserCheck, LogOut, ExternalLink, Crosshair } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import {
  attendanceApi, fmtMinutes,
  type BoardRow, type LocationRow, type TrailPoint,
} from "../lib/attendanceApi.js";
import "./attendance-board.css";

const POLL_MS = 30_000;

function todayLocalISO(): string {
  const d = new Date();
  // Use the browser's local date; the server keys on Asia/Kolkata but for the
  // picker default this is close enough and the user can change it.
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeOf(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function sinceLabel(iso: string | null) {
  if (!iso) return "never";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function AttendanceBoard() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [date, setDate] = useState(todayLocalISO());
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pollRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const boards = await attendanceApi.today(date);
      setRows(boards.data.rows);
      if (isSuperAdmin) {
        const loc = await attendanceApi.locations(date);
        setLocations(loc.data.locations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [date, isSuperAdmin]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Auto-refresh while viewing today.
  useEffect(() => {
    if (date !== todayLocalISO()) return;
    pollRef.current = window.setInterval(load, POLL_MS);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [date, load]);

  // Load the trail for the selected employee.
  useEffect(() => {
    if (!isSuperAdmin || !selected) { setTrail([]); return; }
    let active = true;
    attendanceApi.trail(selected, date)
      .then((res) => { if (active) setTrail(res.data.trail); })
      .catch(() => { if (active) setTrail([]); });
    return () => { active = false; };
  }, [selected, date, isSuperAdmin]);

  const kpi = useMemo(() => {
    const onClock = rows.filter((r) => !r.finalized).length;
    const done = rows.filter((r) => r.finalized).length;
    const late = rows.filter((r) => r.status === "LATE").length;
    return { onClock, done, late, total: rows.length };
  }, [rows]);

  const locById = useMemo(() => {
    const m = new Map<string, LocationRow>();
    for (const l of locations) m.set(l.userId, l);
    return m;
  }, [locations]);

  const selectedLoc = selected ? locById.get(selected) ?? null : null;

  return (
    <div className="wd-page wd-ab">
      <div className="wd-page-head">
        <div>
          <h1 className="wd-ab-title">Live Attendance{isSuperAdmin && " & Location"}</h1>
          <p className="wd-ab-sub">
            {isSuperAdmin
              ? "Real-time punch board with employee location. Location is visible to super admins only."
              : "Real-time punch board. Office time starts at punch-in; attendance completes at punch-out."}
          </p>
        </div>
        <div className="wd-ab-controls">
          <input type="date" className="wd-ab-date" value={date} max={todayLocalISO()} onChange={(e) => setDate(e.target.value)} />
          <button className="wd-ghost-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {error && <div className="wd-ab-error">{error}</div>}

      <div className="wd-ab-kpis">
        <div className="wd-ab-kpi"><span className="wd-ab-kpi-dot on" /><strong>{kpi.onClock}</strong><span>On the clock</span></div>
        <div className="wd-ab-kpi"><UserCheck size={15} /><strong>{kpi.done}</strong><span>Punched out</span></div>
        <div className="wd-ab-kpi"><Clock size={15} /><strong>{kpi.late}</strong><span>Late</span></div>
        <div className="wd-ab-kpi"><strong>{kpi.total}</strong><span>Total today</span></div>
      </div>

      <div className={`wd-ab-layout${isSuperAdmin && selectedLoc ? " has-map" : ""}`}>
        <div className="wd-ab-tablecard">
          {loading ? (
            <div className="wd-ab-loading">Loading attendance…</div>
          ) : rows.length === 0 ? (
            <div className="wd-ab-empty">No punches recorded for this day.</div>
          ) : (
            <div className="wd-ab-tablewrap">
              <table className="wd-ab-table">
                <thead>
                  <tr>
                    <th>Employee</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th>
                    {isSuperAdmin && <th>Location</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const loc = locById.get(r.userId);
                    const hasLoc = !!(loc && loc.lastLat != null && loc.lastLng != null);
                    return (
                      <tr key={r.id} className={selected === r.userId ? "is-sel" : ""}>
                        <td>
                          <div className="wd-ab-emp">
                            <span className={`wd-ab-emp-dot${r.finalized ? "" : " on"}`} />
                            <div>
                              <strong>{r.user.name}</strong>
                              <span className="wd-ab-emp-sub">{r.user.jobTitle || r.user.role.toLowerCase()}{r.user.department ? ` · ${r.user.department}` : ""}</span>
                            </div>
                          </div>
                        </td>
                        <td>{timeOf(r.firstPunchIn)}</td>
                        <td>{r.finalized ? timeOf(r.lastPunchOut) : <span className="wd-ab-pill on">on clock</span>}</td>
                        <td>{r.finalized ? fmtMinutes(r.workedMinutes) : <span className="wd-ab-muted">running</span>}</td>
                        <td><span className={`wd-ab-status s-${r.status.toLowerCase()}`}>{r.status.replace("_", " ")}</span></td>
                        {isSuperAdmin && (
                          <td>
                            {hasLoc ? (
                              <button className="wd-ab-loc-btn" onClick={() => setSelected(r.userId)}>
                                <MapPin size={13} /> {sinceLabel(loc!.lastSeen)}
                              </button>
                            ) : (
                              <span className="wd-ab-muted">no fix</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {isSuperAdmin && selectedLoc && selectedLoc.lastLat != null && selectedLoc.lastLng != null && (
          <div className="wd-ab-mapcard">
            <div className="wd-ab-map-head">
              <div>
                <strong>{selectedLoc.name}</strong>
                <span className="wd-ab-emp-sub">
                  {selectedLoc.onClock ? "On the clock" : "Punched out"} · last seen {sinceLabel(selectedLoc.lastSeen)}
                </span>
              </div>
              <button className="wd-ab-map-close" onClick={() => setSelected(null)} aria-label="Close map"><LogOut size={15} /></button>
            </div>
            <iframe
              key={`${selectedLoc.lastLat},${selectedLoc.lastLng}`}
              title="Employee location"
              className="wd-ab-map"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${selectedLoc.lastLat},${selectedLoc.lastLng}&z=16&output=embed`}
            />
            <div className="wd-ab-map-actions">
              <a className="wd-ghost-btn" href={`https://www.google.com/maps/search/?api=1&query=${selectedLoc.lastLat},${selectedLoc.lastLng}`} target="_blank" rel="noreferrer">
                <ExternalLink size={13} /> Open in Google Maps
              </a>
              <span className="wd-ab-coords"><Crosshair size={12} /> {selectedLoc.lastLat.toFixed(5)}, {selectedLoc.lastLng.toFixed(5)}{selectedLoc.lastAccuracy != null ? ` · ±${Math.round(selectedLoc.lastAccuracy)}m` : ""}</span>
            </div>
            {trail.length > 0 && (
              <div className="wd-ab-trail">
                <div className="wd-ab-trail-head">Location trail · {trail.length} points</div>
                <ul>
                  {trail.slice().reverse().slice(0, 30).map((p, i) => (
                    <li key={i}>
                      <span className={`wd-ab-trail-kind k-${p.kind}`}>{p.kind.replace("_", " ")}</span>
                      <span>{new Date(p.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`} target="_blank" rel="noreferrer">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
