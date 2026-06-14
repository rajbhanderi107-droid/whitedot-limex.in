/* Workforce store — Employees, Attendance, Tasks, Leave & Payroll.
 *
 * No backend Workforce tables exist yet, so this module is a self-contained
 * client store seeded with demo data and persisted to localStorage (one
 * shared key per browser). It mirrors the "Infinity Growth OS" scaffold
 * pattern: rich, working UI now; swap the hooks for portalApi calls when the
 * server gains Employee/Attendance/Leave tables. Every mutation is local +
 * synchronous, so the UI never blocks. */

import { useCallback, useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────── */

export type EmployeeStatus = "Active" | "On Leave" | "Probation" | "Resigned";
export type EmployType = "Full-Time" | "Part-Time" | "Contract" | "Intern";
export type AttendanceStatus = "Present" | "Late" | "Absent" | "Leave" | "WFH";
export type TaskStage = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  type: "Full-Time" | "Part-Time" | "Contract" | "Intern";
  status: EmployeeStatus;
  joinedAt: string;        // ISO date
  avatarHue: number;       // 0–360, deterministic avatar tint
  manager?: string;
  /** leave balances (days) */
  leave: { annual: number; sick: number; casual: number; usedAnnual: number; usedSick: number; usedCasual: number };
  /** monthly CTC in INR */
  salary: number;
  kpi: number;             // 0–100 performance score
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;            // YYYY-MM-DD
  checkIn?: string;        // HH:MM
  checkOut?: string;       // HH:MM
  status: AttendanceStatus;
}

export interface WorkTask {
  id: string;
  employeeId: string;
  title: string;
  project: string;
  stage: TaskStage;
  priority: TaskPriority;
  due: string;             // YYYY-MM-DD
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "Annual" | "Sick" | "Casual";
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
}

export interface WorkforceData {
  employees: Employee[];
  attendance: AttendanceRecord[];
  tasks: WorkTask[];
  leave: LeaveRequest[];
}

/* ─── Seed ──────────────────────────────────────────────────── */

const DEPARTMENTS = ["Sales", "Marketing", "Operations", "Product", "Finance", "Support"];

const SEED_EMPLOYEES: Employee[] = [
  { id: "e1", name: "Aarav Mehta", role: "Sales Lead", department: "Sales", email: "aarav@whitedotindia.in", phone: "+91 98250 11001", location: "Ahmedabad", type: "Full-Time", status: "Active", joinedAt: "2024-02-12", avatarHue: 150, manager: "Raj Bhanderi", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 6, usedSick: 2, usedCasual: 1 }, salary: 78000, kpi: 91 },
  { id: "e2", name: "Priya Nair", role: "Marketing Manager", department: "Marketing", email: "priya@whitedotindia.in", phone: "+91 98250 11002", location: "Surat", type: "Full-Time", status: "Active", joinedAt: "2023-09-04", avatarHue: 168, manager: "Raj Bhanderi", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 9, usedSick: 4, usedCasual: 2 }, salary: 86000, kpi: 88 },
  { id: "e3", name: "Karan Shah", role: "Operations Exec", department: "Operations", email: "karan@whitedotindia.in", phone: "+91 98250 11003", location: "Rajkot", type: "Full-Time", status: "Active", joinedAt: "2024-05-20", avatarHue: 135, manager: "Aarav Mehta", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 3, usedSick: 1, usedCasual: 0 }, salary: 52000, kpi: 79 },
  { id: "e4", name: "Ananya Rao", role: "Product Designer", department: "Product", email: "ananya@whitedotindia.in", phone: "+91 98250 11004", location: "Vadodara", type: "Full-Time", status: "On Leave", joinedAt: "2023-11-15", avatarHue: 182, manager: "Priya Nair", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 12, usedSick: 3, usedCasual: 4 }, salary: 72000, kpi: 84 },
  { id: "e5", name: "Rohan Patel", role: "Sales Exec", department: "Sales", email: "rohan@whitedotindia.in", phone: "+91 98250 11005", location: "Ahmedabad", type: "Full-Time", status: "Active", joinedAt: "2024-07-01", avatarHue: 156, manager: "Aarav Mehta", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 2, usedSick: 0, usedCasual: 1 }, salary: 48000, kpi: 82 },
  { id: "e6", name: "Sneha Iyer", role: "Content Lead", department: "Marketing", email: "sneha@whitedotindia.in", phone: "+91 98250 11006", location: "Surat", type: "Full-Time", status: "Active", joinedAt: "2024-01-22", avatarHue: 174, manager: "Priya Nair", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 7, usedSick: 5, usedCasual: 2 }, salary: 61000, kpi: 86 },
  { id: "e7", name: "Vikram Desai", role: "Finance Analyst", department: "Finance", email: "vikram@whitedotindia.in", phone: "+91 98250 11007", location: "Ahmedabad", type: "Full-Time", status: "Active", joinedAt: "2023-06-18", avatarHue: 142, manager: "Raj Bhanderi", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 10, usedSick: 2, usedCasual: 3 }, salary: 69000, kpi: 80 },
  { id: "e8", name: "Meera Joshi", role: "Support Specialist", department: "Support", email: "meera@whitedotindia.in", phone: "+91 98250 11008", location: "Rajkot", type: "Part-Time", status: "Active", joinedAt: "2024-09-10", avatarHue: 188, manager: "Karan Shah", leave: { annual: 12, sick: 8, casual: 6, usedAnnual: 1, usedSick: 0, usedCasual: 0 }, salary: 34000, kpi: 77 },
  { id: "e9", name: "Dev Trivedi", role: "Marketing Intern", department: "Marketing", email: "dev@whitedotindia.in", phone: "+91 98250 11009", location: "Surat", type: "Intern", status: "Probation", joinedAt: "2025-04-01", avatarHue: 162, manager: "Sneha Iyer", leave: { annual: 6, sick: 4, casual: 4, usedAnnual: 0, usedSick: 1, usedCasual: 0 }, salary: 18000, kpi: 72 },
  { id: "e10", name: "Isha Kulkarni", role: "Ops Associate", department: "Operations", email: "isha@whitedotindia.in", phone: "+91 98250 11010", location: "Vadodara", type: "Full-Time", status: "Active", joinedAt: "2024-03-28", avatarHue: 146, manager: "Karan Shah", leave: { annual: 18, sick: 12, casual: 8, usedAnnual: 4, usedSick: 2, usedCasual: 1 }, salary: 45000, kpi: 81 },
];

const TASK_TITLES: { title: string; project: string; priority: TaskPriority }[] = [
  { title: "Follow up with Surat packaging lead", project: "LIMEX Sales", priority: "high" },
  { title: "Draft Q3 sustainability report", project: "ESG", priority: "medium" },
  { title: "Update product datasheet — LIMEX HD", project: "PIM", priority: "medium" },
  { title: "Schedule Instagram reel batch", project: "Social Studio", priority: "low" },
  { title: "Reconcile sample dispatch invoices", project: "Finance", priority: "high" },
  { title: "Prepare distributor onboarding deck", project: "Growth", priority: "urgent" },
  { title: "Audit landing page form leads", project: "Web", priority: "medium" },
  { title: "Reply to support tickets backlog", project: "Support", priority: "high" },
];

const STAGES: TaskStage[] = ["todo", "in-progress", "review", "done"];

function todayISO(offset = 0): string {
  // Deterministic-ish: derived from a fixed anchor to avoid Date.now nondeterminism in tests.
  const d = new Date(2026, 5, 14 + offset); // 2026-06-14 anchor
  return d.toISOString().slice(0, 10);
}

function seedAttendance(): AttendanceRecord[] {
  const recs: AttendanceRecord[] = [];
  // Last 5 working days for each employee.
  for (let d = 0; d < 5; d++) {
    const date = todayISO(-d);
    SEED_EMPLOYEES.forEach((e, i) => {
      const roll = (i + d) % 10;
      let status: AttendanceStatus = "Present";
      let checkIn: string | undefined = "09:0" + ((i % 6) + 1);
      let checkOut: string | undefined = "18:1" + (i % 5);
      if (e.status === "On Leave" && d === 0) { status = "Leave"; checkIn = undefined; checkOut = undefined; }
      else if (roll === 3) { status = "Late"; checkIn = "10:2" + (i % 6); }
      else if (roll === 7) { status = "Absent"; checkIn = undefined; checkOut = undefined; }
      else if (roll === 5) { status = "WFH"; }
      recs.push({ id: `a-${e.id}-${d}`, employeeId: e.id, date, checkIn, checkOut, status });
    });
  }
  return recs;
}

function seedTasks(): WorkTask[] {
  const tasks: WorkTask[] = [];
  SEED_EMPLOYEES.forEach((e, i) => {
    const n = 3 + (i % 3);
    for (let t = 0; t < n; t++) {
      const tpl = TASK_TITLES[(i + t) % TASK_TITLES.length];
      tasks.push({
        id: `t-${e.id}-${t}`,
        employeeId: e.id,
        title: tpl.title,
        project: tpl.project,
        stage: STAGES[(i + t) % STAGES.length],
        priority: tpl.priority,
        due: todayISO(((i + t) % 6) + 1),
      });
    }
  });
  return tasks;
}

function seedLeave(): LeaveRequest[] {
  return [
    { id: "l1", employeeId: "e4", type: "Annual", from: todayISO(-1), to: todayISO(3), days: 5, reason: "Family function", status: "Approved" },
    { id: "l2", employeeId: "e6", type: "Sick", from: todayISO(2), to: todayISO(3), days: 2, reason: "Fever", status: "Pending" },
    { id: "l3", employeeId: "e2", type: "Casual", from: todayISO(5), to: todayISO(5), days: 1, reason: "Personal work", status: "Pending" },
    { id: "l4", employeeId: "e7", type: "Annual", from: todayISO(10), to: todayISO(13), days: 4, reason: "Vacation", status: "Pending" },
  ];
}

function seed(): WorkforceData {
  return { employees: SEED_EMPLOYEES, attendance: seedAttendance(), tasks: seedTasks(), leave: seedLeave() };
}

/* ─── Persistence ───────────────────────────────────────────── */

const KEY = "wd.workforce.v1";

function load(): WorkforceData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WorkforceData>;
      if (parsed.employees?.length) {
        return {
          employees: parsed.employees,
          attendance: parsed.attendance ?? [],
          tasks: parsed.tasks ?? [],
          leave: parsed.leave ?? [],
        };
      }
    }
  } catch { /* ignore — fall through to seed */ }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore quota */ }
  return s;
}

function persist(data: WorkforceData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore quota */ }
}

/* ─── Hook ──────────────────────────────────────────────────── */

export const WF_DEPARTMENTS = DEPARTMENTS;
export const TASK_STAGES: { key: TaskStage; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

let uid = 0;
function nextId(prefix: string) { uid += 1; return `${prefix}-${uid}-${(2026 + uid) % 9973}`; }

export function useWorkforce() {
  const [data, setData] = useState<WorkforceData>(() => load());

  useEffect(() => { persist(data); }, [data]);

  const addEmployee = useCallback((e: Omit<Employee, "id" | "avatarHue" | "kpi" | "leave"> & Partial<Pick<Employee, "leave" | "kpi">>) => {
    setData((d) => ({
      ...d,
      employees: [
        {
          id: nextId("e"),
          avatarHue: 130 + (d.employees.length * 11) % 70,
          kpi: e.kpi ?? 75,
          leave: e.leave ?? { annual: 18, sick: 12, casual: 8, usedAnnual: 0, usedSick: 0, usedCasual: 0 },
          ...e,
        } as Employee,
        ...d.employees,
      ],
    }));
  }, []);

  const setTaskStage = useCallback((taskId: string, stage: TaskStage) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, stage } : t)) }));
  }, []);

  const addTask = useCallback((employeeId: string, title: string, project: string, priority: TaskPriority, due: string) => {
    setData((d) => ({
      ...d,
      tasks: [{ id: nextId("t"), employeeId, title, project, priority, due, stage: "todo" }, ...d.tasks],
    }));
  }, []);

  const checkIn = useCallback((employeeId: string, time: string) => {
    setData((d) => {
      const date = todayISO(0);
      const existing = d.attendance.find((a) => a.employeeId === employeeId && a.date === date);
      const late = time > "09:45";
      if (existing) {
        return { ...d, attendance: d.attendance.map((a) => a === existing ? { ...a, checkIn: time, status: late ? "Late" : "Present" } : a) };
      }
      return { ...d, attendance: [{ id: nextId("a"), employeeId, date, checkIn: time, status: late ? "Late" : "Present" }, ...d.attendance] };
    });
  }, []);

  const checkOut = useCallback((employeeId: string, time: string) => {
    setData((d) => {
      const date = todayISO(0);
      return { ...d, attendance: d.attendance.map((a) => (a.employeeId === employeeId && a.date === date ? { ...a, checkOut: time } : a)) };
    });
  }, []);

  const setLeaveStatus = useCallback((leaveId: string, status: LeaveStatus) => {
    setData((d) => ({ ...d, leave: d.leave.map((l) => (l.id === leaveId ? { ...l, status } : l)) }));
  }, []);

  const reset = useCallback(() => setData(seed()), []);

  return { data, addEmployee, setTaskStage, addTask, checkIn, checkOut, setLeaveStatus, reset, today: todayISO(0) };
}

/* ─── Selectors / helpers ───────────────────────────────────── */

export function empById(data: WorkforceData, id: string): Employee | undefined {
  return data.employees.find((e) => e.id === id);
}

export function attendanceForDate(data: WorkforceData, date: string): AttendanceRecord[] {
  return data.attendance.filter((a) => a.date === date);
}

export function tenureMonths(joinedAt: string, today: string): number {
  const a = new Date(joinedAt), b = new Date(today);
  return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()));
}
