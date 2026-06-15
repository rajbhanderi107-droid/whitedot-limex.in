/* Attendance & location client — talks to the digital-office backend.
 * Punch in/out + continuous live location pings (super-admin-only visibility). */

import { api } from "./api.js";

export type AttStatus = "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" | "WFH";

export interface AttendanceDay {
  id: string;
  userId: string;
  date: string;
  firstPunchIn: string;
  lastPunchOut: string | null;
  status: AttStatus;
  finalized: boolean;
  workedMinutes: number;
}

export interface MyAttendance {
  today: AttendanceDay | null;
  history: AttendanceDay[];
}

export interface BoardRow {
  id: string;
  userId: string;
  date: string;
  firstPunchIn: string;
  lastPunchOut: string | null;
  status: AttStatus;
  finalized: boolean;
  workedMinutes: number;
  user: { name: string; email: string; role: string; jobTitle: string | null; department: string | null };
}

export interface LocationRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  department: string | null;
  onClock: boolean;
  status: AttStatus;
  firstPunchIn: string;
  lastPunchOut: string | null;
  lastLat: number | null;
  lastLng: number | null;
  lastAccuracy: number | null;
  lastSeen: string | null;
  lastKind: string | null;
}

export interface TrailPoint {
  lat: number;
  lng: number;
  accuracy: number | null;
  kind: string;
  createdAt: string;
}

export interface GeoFix { lat: number; lng: number; accuracy: number | null }

/** Ask the browser for a single GPS fix. Resolves null if denied/unavailable. */
export function getFix(opts?: PositionOptions): Promise<GeoFix | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 8000, ...opts },
    );
  });
}

export const attendanceApi = {
  me: () => api.getFresh<MyAttendance>("/api/attendance/me"),
  punchIn: (fix: GeoFix | null) => api.post<AttendanceDay>("/api/attendance/punch-in", fix ?? {}),
  punchOut: (fix: GeoFix | null) => api.post<AttendanceDay>("/api/attendance/punch-out", fix ?? {}),
  ping: (fix: GeoFix) => api.post<{ accepted: boolean }>("/api/attendance/ping", fix),
  today: (date?: string) => api.getFresh<{ date: string; rows: BoardRow[] }>(`/api/attendance/today${date ? `?date=${date}` : ""}`),
  locations: (date?: string) => api.getFresh<{ date: string; locations: LocationRow[] }>(`/api/attendance/locations${date ? `?date=${date}` : ""}`),
  trail: (userId: string, date?: string) => api.getFresh<{ date: string; user: { id: string; name: string }; trail: TrailPoint[] }>(`/api/attendance/locations/${userId}${date ? `?date=${date}` : ""}`),
};

/** Format minutes as "8h 12m". */
export function fmtMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
