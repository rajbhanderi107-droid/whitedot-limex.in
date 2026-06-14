/* Workforce store — Employees, Attendance, Tasks, Leave & Payroll.
 *
 * Fully editable by super admin. No hardcoded employees — starts empty.
 * Persisted to localStorage. Swap hooks for portalApi calls when the
 * server gains Employee/Attendance/Leave tables. */

import { useCallback, useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────── */

export type EmployeeStatus = "Active" | "On Leave" | "Probation" | "Resigned" | "Terminated";
export type EmployType = "Full-Time" | "Part-Time" | "Contract" | "Intern" | "Freelance";
export type AttendanceStatus = "Present" | "Late" | "Absent" | "Leave" | "WFH";
export type TaskStage = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export const ROLE_OPTIONS = [
  // Leadership
  "CEO", "COO", "CTO", "CFO", "CMO", "CPO",
  "VP Product", "VP Engineering", "VP Sales", "VP Marketing", "VP Operations",
  // Product Management
  "Head of Product", "Senior Product Manager", "Product Manager", "Associate Product Manager",
  "Product Owner", "Product Analyst", "Product Strategist", "Growth Product Manager",
  // Engineering
  "Engineering Manager", "Tech Lead", "Senior Developer", "Full-Stack Developer",
  "Frontend Developer", "Backend Developer", "DevOps Engineer", "QA Engineer",
  "Data Engineer", "ML Engineer", "Mobile Developer",
  // Design
  "Head of Design", "Senior Product Designer", "Product Designer", "UX Researcher",
  "UI Designer", "Design System Lead", "Motion Designer",
  // Marketing
  "Marketing Director", "Marketing Manager", "Content Lead", "SEO Specialist",
  "Social Media Manager", "Brand Manager", "Performance Marketer", "Growth Manager",
  // Sales
  "Sales Director", "Sales Lead", "Account Executive", "Business Development Manager",
  "Key Account Manager", "Sales Operations", "Sales Analyst",
  // Operations
  "Operations Director", "Operations Manager", "Operations Executive",
  "Supply Chain Manager", "Logistics Coordinator", "Procurement Manager",
  // Finance
  "Finance Director", "Finance Manager", "Finance Analyst", "Accountant",
  "Accounts Payable", "Accounts Receivable", "Payroll Specialist",
  // HR & People
  "HR Director", "HR Manager", "HR Executive", "Talent Acquisition Lead",
  "People Operations", "L&D Manager",
  // Support
  "Support Manager", "Support Lead", "Support Specialist", "Customer Success Manager",
  // Data & Analytics
  "Data Lead", "Data Analyst", "Business Analyst", "BI Analyst",
  // Other
  "Project Manager", "Program Manager", "Scrum Master", "Agile Coach",
  "Legal Counsel", "Compliance Officer", "Office Manager", "Executive Assistant",
  "Intern",
];

export const DEPARTMENTS = [
  "Leadership", "Product", "Engineering", "Design", "Marketing",
  "Sales", "Operations", "Finance", "HR & People", "Support",
  "Data & Analytics", "Legal & Compliance",
];

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  type: EmployType;
  status: EmployeeStatus;
  joinedAt: string;
  avatarHue: number;
  manager?: string;
  leave: { annual: number; sick: number; casual: number; usedAnnual: number; usedSick: number; usedCasual: number };
  salary: number;
  kpi: number;
  tools: string[];
  workspace: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
}

export interface WorkTask {
  id: string;
  employeeId: string;
  title: string;
  project: string;
  stage: TaskStage;
  priority: TaskPriority;
  due: string;
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

/* ─── Persistence ───────────────────────────────────────────── */

const KEY = "wd.workforce.v2";

function load(): WorkforceData {
  try {
    // Purge any legacy seeded data so old demo employees never reappear.
    for (const old of ["wd.workforce.v1", "wd.workforce"]) {
      if (localStorage.getItem(old)) localStorage.removeItem(old);
    }
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WorkforceData>;
      return {
        employees: parsed.employees ?? [],
        attendance: parsed.attendance ?? [],
        tasks: parsed.tasks ?? [],
        leave: parsed.leave ?? [],
      };
    }
  } catch { /* ignore */ }
  return { employees: [], attendance: [], tasks: [], leave: [] };
}

function persist(data: WorkforceData) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota */ }
}

/* ─── Hook ──────────────────────────────────────────────────── */

export const WF_DEPARTMENTS = DEPARTMENTS;
export const TASK_STAGES: { key: TaskStage; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

let uid = Date.now();
function nextId(prefix: string) { uid += 1; return `${prefix}-${uid}`; }

export function todayISO(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function useWorkforce() {
  const [data, setData] = useState<WorkforceData>(() => load());

  useEffect(() => { persist(data); }, [data]);

  const addEmployee = useCallback((e: Omit<Employee, "id" | "avatarHue"> & Partial<Pick<Employee, "avatarHue">>) => {
    setData((d) => ({
      ...d,
      employees: [
        {
          id: nextId("e"),
          avatarHue: e.avatarHue ?? (130 + (d.employees.length * 17) % 70),
          ...e,
        } as Employee,
        ...d.employees,
      ],
    }));
  }, []);

  const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
    setData((d) => ({
      ...d,
      employees: d.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      employees: d.employees.filter((e) => e.id !== id),
      tasks: d.tasks.filter((t) => t.employeeId !== id),
      attendance: d.attendance.filter((a) => a.employeeId !== id),
      leave: d.leave.filter((l) => l.employeeId !== id),
    }));
  }, []);

  const setTaskStage = useCallback((taskId: string, stage: TaskStage) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, stage } : t)) }));
  }, []);

  const addTask = useCallback((employeeId: string, title: string, project: string, priority: TaskPriority, due: string) => {
    setData((d) => ({
      ...d,
      tasks: [{ id: nextId("t"), employeeId, title, project, priority, due, stage: "todo" as TaskStage }, ...d.tasks],
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setData((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== taskId) }));
  }, []);

  const checkIn = useCallback((employeeId: string, time: string) => {
    setData((d) => {
      const date = todayISO(0);
      const existing = d.attendance.find((a) => a.employeeId === employeeId && a.date === date);
      const late = time > "09:45";
      if (existing) {
        return { ...d, attendance: d.attendance.map((a) => a === existing ? { ...a, checkIn: time, status: (late ? "Late" : "Present") as AttendanceStatus } : a) };
      }
      return { ...d, attendance: [{ id: nextId("a"), employeeId, date, checkIn: time, status: (late ? "Late" : "Present") as AttendanceStatus }, ...d.attendance] };
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

  const addLeave = useCallback((req: Omit<LeaveRequest, "id">) => {
    setData((d) => ({ ...d, leave: [{ id: nextId("l"), ...req }, ...d.leave] }));
  }, []);

  const reset = useCallback(() => {
    const empty: WorkforceData = { employees: [], attendance: [], tasks: [], leave: [] };
    setData(empty);
  }, []);

  return {
    data, addEmployee, updateEmployee, deleteEmployee,
    setTaskStage, addTask, deleteTask,
    checkIn, checkOut, setLeaveStatus, addLeave, reset,
    today: todayISO(0),
  };
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

export const TOOL_OPTIONS = [
  "Slack", "Notion", "Jira", "Linear", "Figma", "GitHub", "VS Code",
  "Google Workspace", "Zoom", "Loom", "Miro", "Confluence", "Trello",
  "HubSpot", "Salesforce", "Mixpanel", "Amplitude", "Hotjar",
  "Adobe Creative Suite", "Canva", "ChatGPT", "Claude", "Cursor",
  "AWS Console", "Vercel", "Render", "Docker", "Postman",
  "Excel / Sheets", "Power BI", "Tableau", "QuickBooks", "Tally",
  "WhatsApp Business", "Intercom", "Zendesk", "Freshdesk",
];

export const WORKSPACE_OPTIONS = [
  "Office — Ahmedabad", "Office — Surat", "Office — Rajkot", "Office — Vadodara",
  "Remote — India", "Remote — International", "Hybrid", "Field / On-site",
];
