/* Workforce client — employees (User+profile), tasks, leave, departments,
 * performance, goals, onboarding, payroll, announcements. Backend-backed. */

import { api } from "./api.js";
import type { AttendanceDay } from "./attendanceApi.js";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "FREELANCE";
export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "PROBATION" | "RESIGNED" | "TERMINATED";
export type TaskStage = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type LeaveKind = "ANNUAL" | "SICK" | "CASUAL";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type GoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";
export type AnnouncementAudience = "ALL" | "DEPARTMENT";

export interface DeptRef {
  id: string;
  name: string;
  code?: string | null;
}

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
  // Extended HR profile
  employeeCode: string | null;
  departmentId: string | null;
  dept?: DeptRef | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  bloodGroup: string | null;
  bankName: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  taxId: string | null;
  probationEndsAt: string | null;
  contractEndsAt: string | null;
  weeklyHours: number | null;
  currency: string | null;
  payFrequency: string | null;
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

export interface PerformanceReview {
  id: string;
  userId: string;
  period: string;
  rating: number;
  strengths: string | null;
  improvements: string | null;
  reviewerId: string | null;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  progress: number;
  status: GoalStatus;
  dueDate: string | null;
  createdAt: string;
}

export interface OnboardingTask {
  id: string;
  userId: string;
  label: string;
  done: boolean;
  order: number;
  createdAt: string;
}

export interface Payslip {
  id: string;
  userId: string;
  month: string;
  gross: number;
  deductions: number;
  net: number;
  currency: string;
  notes: string | null;
  issuedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  departmentId: string | null;
  department?: DeptRef | null;
  createdById: string | null;
  createdBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  headId: string | null;
  headName: string | null;
  employeeCount: number;
  createdAt: string;
}

export interface WorkforceOverview {
  headcount: number;
  active: number;
  onLeave: number;
  presentToday: number;
  pendingLeave: number;
  openTasks: number;
  byStatus: { status: EmployeeStatus; count: number }[];
  byType: { type: EmploymentType; count: number }[];
  byDepartment: { departmentId: string | null; department: string; count: number }[];
}

export interface EmployeeDetail extends Employee {
  workTasks: WorkTask[];
  leaveRequests: LeaveRequest[];
  attendanceDays: AttendanceDay[];
  reviewsReceived: PerformanceReview[];
  goals: Goal[];
  onboardingTasks: OnboardingTask[];
  payslips: Payslip[];
}

export interface MyWorkspace extends Employee {
  workTasks: WorkTask[];
  leaveRequests: LeaveRequest[];
  goals: Goal[];
  onboardingTasks: OnboardingTask[];
  payslips: Payslip[];
  reviewsReceived: PerformanceReview[];
  attendanceDays: AttendanceDay[];
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

  // ── Workforce overview ──
  workforceOverview: () => api.getFresh<WorkforceOverview>("/api/workforce/overview"),

  // ── Departments ──
  listDepartments: () => api.getFresh<Department[]>("/api/departments"),
  createDepartment: (body: Record<string, unknown>) => api.post<Department>("/api/departments", body),
  updateDepartment: (id: string, body: Record<string, unknown>) => api.patch<Department>(`/api/departments/${id}`, body),
  deleteDepartment: (id: string) => api.delete(`/api/departments/${id}`),

  // ── Performance / goals / onboarding / payroll (admin) ──
  addReview: (id: string, body: Record<string, unknown>) => api.post<PerformanceReview>(`/api/employees/${id}/reviews`, body),
  addGoal: (id: string, body: Record<string, unknown>) => api.post<Goal>(`/api/employees/${id}/goals`, body),
  updateGoal: (goalId: string, body: Record<string, unknown>) => api.patch<Goal>(`/api/goals/${goalId}`, body),
  deleteGoal: (goalId: string) => api.delete(`/api/goals/${goalId}`),
  addOnboarding: (id: string, body: Record<string, unknown>) => api.post<OnboardingTask>(`/api/employees/${id}/onboarding`, body),
  updateOnboarding: (taskId: string, done: boolean) => api.patch<OnboardingTask>(`/api/onboarding/${taskId}`, { done }),
  addPayslip: (id: string, body: Record<string, unknown>) => api.post<Payslip>(`/api/employees/${id}/payslips`, body),

  // ── Announcements ──
  listAnnouncements: () => api.getFresh<Announcement[]>("/api/announcements"),
  createAnnouncement: (body: Record<string, unknown>) => api.post<Announcement>("/api/announcements", body),
  deleteAnnouncement: (id: string) => api.delete(`/api/announcements/${id}`),

  // ── Self-service ──
  myWorkspace: () => api.getFresh<MyWorkspace>("/api/me/workspace"),
  requestLeave: (body: Record<string, unknown>) => api.post<LeaveRequest>("/api/me/leave", body),
  myPayslips: () => api.getFresh<Payslip[]>("/api/me/payslips"),
  updateMyOnboarding: (taskId: string, done: boolean) => api.patch<OnboardingTask>(`/api/me/onboarding/${taskId}`, { done }),
  updateMyGoal: (goalId: string, progress: number) => api.patch<Goal>(`/api/me/goals/${goalId}`, { progress }),
};
