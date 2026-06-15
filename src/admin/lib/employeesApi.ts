/* Workforce client — employees (User+profile), tasks, leave. Backend-backed. */

import { api } from "./api.js";
import type { AttendanceDay } from "./attendanceApi.js";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "FREELANCE";
export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "PROBATION" | "RESIGNED" | "TERMINATED";
export type TaskStage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LeaveKind = "ANNUAL" | "SICK" | "CASUAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface EmployeeProfile {
  location: string | null;
  type: EmploymentType;
  status: EmployeeStatus;
  joinedAt: string;
  manager: string | null;
  salary: number;
  kpi: number;
  tools: string[];
  workspace: string | null;
  notes: string | null;
  avatarHue: number;
  annual: number; sick: number; casual: number;
  usedAnnual: number; usedSick: number; usedCasual: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
  createdAt: string;
  employeeProfile: EmployeeProfile | null;
  tasksTotal?: number;
  tasksDone?: number;
}

export interface WorkTask {
  id: string;
  userId: string;
  title: string;
  project: string | null;
  stage: TaskStage;
  priority: TaskPriority;
  due: string | null;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveKind;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
}

export interface EmployeeDetail extends Employee {
  workTasks: WorkTask[];
  leaveRequests: LeaveRequest[];
  attendanceDays: AttendanceDay[];
}

export interface MyWorkspace extends Employee {
  workTasks: WorkTask[];
  leaveRequests: LeaveRequest[];
}

export const TASK_STAGES: { key: TaskStage; label: string }[] = [
  { key: "TODO", label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "REVIEW", label: "Review" },
  { key: "DONE", label: "Done" },
];

export const EMP_TYPES: EmploymentType[] = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "FREELANCE"];
export const EMP_STATUSES: EmployeeStatus[] = ["ACTIVE", "ON_LEAVE", "PROBATION", "RESIGNED", "TERMINATED"];
export const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function prettyEnum(s: string): string {
  return s.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const employeesApi = {
  list: () => api.getFresh<Employee[]>("/api/employees"),
  get: (id: string) => api.getFresh<EmployeeDetail>(`/api/employees/${id}`),
  create: (body: Record<string, unknown>) => api.post<Employee>("/api/employees", body),
  update: (id: string, body: Record<string, unknown>) => api.patch<Employee>(`/api/employees/${id}`, body),
  addTask: (id: string, body: Record<string, unknown>) => api.post<WorkTask>(`/api/employees/${id}/tasks`, body),
  updateTask: (taskId: string, body: Record<string, unknown>) => api.patch<WorkTask>(`/api/tasks/${taskId}`, body),
  deleteTask: (taskId: string) => api.delete(`/api/tasks/${taskId}`),
  decideLeave: (leaveId: string, status: "APPROVED" | "REJECTED") => api.patch<LeaveRequest>(`/api/leave/${leaveId}`, { status }),
  myWorkspace: () => api.getFresh<MyWorkspace>("/api/me/workspace"),
  requestLeave: (body: Record<string, unknown>) => api.post<LeaveRequest>("/api/me/leave", body),
};
