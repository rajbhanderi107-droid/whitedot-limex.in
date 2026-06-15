/* PunchClock — punch in / punch out with continuous live-location tracking.
 *
 * Office time starts at the first punch-in of the day; attendance is marked
 * complete only when the employee clicks Punch Out. While punched in, the
 * browser streams GPS pings (watchPosition + a safety interval). Location is
 * stored server-side and is visible to the SUPER_ADMIN only.
 *
 * variant="full"    → large card for the employee portal
 * variant="compact" → slim button cluster for the admin topbar */

import { useCallback, useEffect, useRef, useState } from "react";
import { LogIn, LogOut, MapPin, MapPinOff, Loader2 } from "lucide-react";
import { attendanceApi, getFix, fmtMinutes, type AttendanceDay } from "../lib/attendanceApi.js";
import "./punch-clock.css";

const PING_EVERY_MS = 90_000; // safety-net interval between forced pings

function elapsedSince(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  const s = Math.floor((ms / 1000) % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

export function PunchClock({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [today, setToday] = useState<AttendanceDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [tick, setTick] = useState(0); // drives the elapsed clock

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastPingRef = useRef(0);

  const onClock = !!today && !today.finalized;

  const sendPing = useCallback(async (fix: { lat: number; lng: number; accuracy: number | null }) => {
    const now = Date.now();
    if (now - lastPingRef.current < 30_000) return; // throttle bursts
    lastPingRef.current = now;
    try { await attendanceApi.ping(fix); } catch { /* offline — ignore */ }
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { setGeoDenied(true); return; }
    if (watchIdRef.current === null) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (p) => { setGeoDenied(false); void sendPing({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null }); },
        () => setGeoDenied(true),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 15000 },
      );
    }
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(async () => {
        const fix = await getFix();
        if (fix) void sendPing(fix);
      }, PING_EVERY_MS);
    }
  }, [sendPing]);

  const refresh = useCallback(async () => {
    try {
      const res = await attendanceApi.me();
      setToday(res.data.today);
      return res.data.today;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load — resume tracking if already on the clock (e.g. after reload).
  useEffect(() => {
    let active = true;
    (async () => {
      const t = await refresh();
      if (active && t && !t.finalized) startTracking();
    })();
    return () => { active = false; stopTracking(); };
  }, [refresh, startTracking, stopTracking]);

  // 1s tick for the elapsed timer while on the clock.
  useEffect(() => {
    if (!onClock) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [onClock]);

  const handlePunchIn = async () => {
    setBusy(true);
    try {
      const fix = await getFix();
      setGeoDenied(!fix);
      const res = await attendanceApi.punchIn(fix);
      setToday(res.data);
      startTracking();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Punch in failed.");
    } finally {
      setBusy(false);
    }
  };

  const handlePunchOut = async () => {
    setBusy(true);
    try {
      const fix = await getFix();
      const res = await attendanceApi.punchOut(fix);
      setToday(res.data);
      stopTracking();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Punch out failed.");
    } finally {
      setBusy(false);
    }
  };

  void tick; // referenced so the timer re-renders

  const finalizedToday = !!today?.finalized;
  const statusLabel = !today
    ? "Not punched in"
    : today.finalized
      ? `Done · ${fmtMinutes(today.workedMinutes)}`
      : `On the clock · ${elapsedSince(today.firstPunchIn)}`;

  if (variant === "compact") {
    return (
      <div className="wd-punch wd-punch-compact" title={geoDenied ? "Location off — attendance still records" : "Punch clock"}>
        <span className={`wd-punch-dot${onClock ? " on" : ""}`} />
        <span className="wd-punch-status">{loading ? "…" : statusLabel}</span>
        {onClock ? (
          <button className="wd-punch-btn out" onClick={handlePunchOut} disabled={busy}>
            {busy ? <Loader2 size={13} className="wd-spin" /> : <LogOut size={13} />} Punch out
          </button>
        ) : (
          <button className="wd-punch-btn in" onClick={handlePunchIn} disabled={busy || loading || finalizedToday}>
            {busy ? <Loader2 size={13} className="wd-spin" /> : <LogIn size={13} />}
            {finalizedToday ? "Done" : "Punch in"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`wd-punch wd-punch-full${onClock ? " is-on" : ""}`}>
      <div className="wd-punch-head">
        <div>
          <span className="wd-punch-label">Attendance</span>
          <strong className="wd-punch-time">{loading ? "…" : statusLabel}</strong>
        </div>
        <span className={`wd-punch-geo${geoDenied ? " off" : ""}`} title={geoDenied ? "Location permission denied" : "Location tracking active"}>
          {geoDenied ? <MapPinOff size={15} /> : <MapPin size={15} />}
          {geoDenied ? "Location off" : onClock ? "Tracking live" : "Location ready"}
        </span>
      </div>

      {onClock ? (
        <button className="wd-punch-cta out" onClick={handlePunchOut} disabled={busy}>
          {busy ? <Loader2 size={16} className="wd-spin" /> : <LogOut size={16} />} Punch Out & Mark Attendance
        </button>
      ) : (
        <button className="wd-punch-cta in" onClick={handlePunchIn} disabled={busy || loading || finalizedToday}>
          {busy ? <Loader2 size={16} className="wd-spin" /> : <LogIn size={16} />}
          {finalizedToday ? "Attendance already marked today" : "Punch In"}
        </button>
      )}

      <p className="wd-punch-note">
        {finalizedToday
          ? "You've punched out — today's attendance is marked complete."
          : onClock
            ? "Office time is running. Click Punch Out when you leave to complete attendance."
            : "Click Punch In to start your office time. Attendance is marked only after you punch out."}
        {geoDenied && " Enable location to share your work location with the admin."}
      </p>
    </div>
  );
}
