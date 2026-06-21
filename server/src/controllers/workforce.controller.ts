/**
 * Workforce management controller — employees, tasks, leave, departments,
 * performance reviews, goals, onboarding, payslips, announcements.
 *
 * Every endpoint uses the shared Prisma client. Endpoints map 1:1 to the
 * frontend's employeesApi.ts contract.
 */
import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import bcrypt from "bcrypt";

// ─── Employees ───────────────────────────────────────────────

/** GET /api/employees — list all employees (users with an EmployeeProfile). */
export async function listEmployees(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { employeeProfile: { isNot: null } },
    include: {
      employeeProfile: { include: { dept: { select: { id: true, name: true, code: true } } } },
      workTasks: { select: { id: true, stage: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const data = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    jobTitle: u.employeeProfile?.workspace ?? null,
    department: u.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: u.createdAt.toISOString(),
    employeeProfile: u.employeeProfile,
    tasksTotal: u.workTasks.length,
    tasksDone: u.workTasks.filter((t) => t.stage === "DONE").length,
  }));

  return sendSuccess(res, data);
}

/** GET /api/employees/:id — single employee with tasks, leave, reviews, etc. */
export async function getEmployee(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    include: {
      employeeProfile: { include: { dept: { select: { id: true, name: true, code: true } } } },
      workTasks: { orderBy: { createdAt: "desc" } },
      leaveRequests: { orderBy: { createdAt: "desc" } },
      reviewsReceived: { orderBy: { createdAt: "desc" } },
      goals: { orderBy: { createdAt: "desc" } },
      onboardingTasks: { orderBy: { order: "asc" } },
      payslips: { orderBy: { issuedAt: "desc" } },
    },
  });

  if (!user) return sendError(res, "NOT_FOUND", "Employee not found", 404);

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt.toISOString(),
    employeeProfile: user.employeeProfile,
    workTasks: user.workTasks,
    leaveRequests: user.leaveRequests,
    attendanceDays: [], // Attendance is tracked separately
    reviewsReceived: user.reviewsReceived,
    goals: user.goals,
    onboardingTasks: user.onboardingTasks,
    payslips: user.payslips,
    tasksTotal: user.workTasks.length,
    tasksDone: user.workTasks.filter((t) => t.stage === "DONE").length,
  });
}

/** POST /api/employees — create employee (user + profile). */
export async function createEmployee(req: Request, res: Response) {
  const { name, email, password, role, ...profile } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return sendError(res, "CONFLICT", "A user with that email already exists", 409);

  const passwordHash = await bcrypt.hash(password || "changeme123", 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || "EMPLOYEE",
      employeeProfile: {
        create: {
          location: profile.location ?? null,
          type: profile.type ?? "FULL_TIME",
          status: profile.status ?? "ACTIVE",
          manager: profile.manager ?? null,
          salary: profile.salary ? Number(profile.salary) : 0,
          tools: profile.tools ?? [],
          workspace: profile.workspace ?? null,
          notes: profile.notes ?? null,
          avatarHue: profile.avatarHue ?? Math.floor(Math.random() * 360),
          annual: profile.annual ?? 15,
          sick: profile.sick ?? 10,
          casual: profile.casual ?? 7,
          employeeCode: profile.employeeCode ?? null,
          departmentId: profile.departmentId ?? null,
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
          gender: profile.gender ?? null,
          address: profile.address ?? null,
          emergencyName: profile.emergencyName ?? null,
          emergencyPhone: profile.emergencyPhone ?? null,
          bloodGroup: profile.bloodGroup ?? null,
          bankName: profile.bankName ?? null,
          bankAccount: profile.bankAccount ?? null,
          ifsc: profile.ifsc ?? null,
          taxId: profile.taxId ?? null,
          probationEndsAt: profile.probationEndsAt ? new Date(profile.probationEndsAt) : null,
          contractEndsAt: profile.contractEndsAt ? new Date(profile.contractEndsAt) : null,
          weeklyHours: profile.weeklyHours ? Number(profile.weeklyHours) : null,
          currency: profile.currency ?? "INR",
          payFrequency: profile.payFrequency ?? "MONTHLY",
        },
      },
    },
    include: {
      employeeProfile: { include: { dept: { select: { id: true, name: true, code: true } } } },
    },
  });

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt.toISOString(),
    employeeProfile: user.employeeProfile,
  }, undefined, 201);
}

/** PATCH /api/employees/:id — update user + profile. */
export async function updateEmployee(req: Request, res: Response) {
  const { name, email, role, isActive, password, ...profile } = req.body;

  const userUpdate: Record<string, unknown> = {};
  if (name !== undefined) userUpdate.name = name;
  if (email !== undefined) userUpdate.email = email;
  if (role !== undefined) userUpdate.role = role;
  if (isActive !== undefined) userUpdate.isActive = isActive;
  if (password) userUpdate.passwordHash = await bcrypt.hash(password, 12);

  const profileUpdate: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(profile)) {
    if (val === undefined) continue;
    if (key === "salary" || key === "kpi" || key === "annual" || key === "sick" || key === "casual"
        || key === "usedAnnual" || key === "usedSick" || key === "usedCasual"
        || key === "avatarHue" || key === "weeklyHours") {
      profileUpdate[key] = val !== null ? Number(val) : null;
    } else if (key === "dateOfBirth" || key === "probationEndsAt" || key === "contractEndsAt" || key === "joinedAt") {
      profileUpdate[key] = val ? new Date(val as string) : null;
    } else {
      profileUpdate[key] = val;
    }
  }

  const user = await prisma.user.update({
    where: { id: req.params.id as string },
    data: {
      ...userUpdate,
      ...(Object.keys(profileUpdate).length > 0
        ? { employeeProfile: { update: profileUpdate } }
        : {}),
    },
    include: {
      employeeProfile: { include: { dept: { select: { id: true, name: true, code: true } } } },
    },
  });

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt.toISOString(),
    employeeProfile: user.employeeProfile,
  });
}

// ─── Work Tasks ──────────────────────────────────────────────

/** POST /api/employees/:id/tasks — create a task for an employee. */
export async function addTask(req: Request, res: Response) {
  const { title, project, stage, priority, due } = req.body;
  const task = await prisma.workTask.create({
    data: {
      userId: req.params.id as string,
      title,
      project: project ?? null,
      stage: stage ?? "TODO",
      priority: priority ?? "MEDIUM",
      due: due ? new Date(due) : null,
    },
  });
  return sendSuccess(res, task, undefined, 201);
}

/** PATCH /api/tasks/:id — update a task. */
export async function updateTask(req: Request, res: Response) {
  const { title, project, stage, priority, due } = req.body;
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (project !== undefined) data.project = project;
  if (stage !== undefined) data.stage = stage;
  if (priority !== undefined) data.priority = priority;
  if (due !== undefined) data.due = due ? new Date(due) : null;

  const task = await prisma.workTask.update({
    where: { id: req.params.id as string },
    data,
  });
  return sendSuccess(res, task);
}

/** DELETE /api/tasks/:id — delete a task. */
export async function deleteTask(req: Request, res: Response) {
  await prisma.workTask.delete({ where: { id: req.params.id as string } });
  return sendSuccess(res, { deleted: true });
}

// ─── Leave ───────────────────────────────────────────────────

/** PATCH /api/leave/:id — approve or reject a leave request. */
export async function decideLeave(req: Request, res: Response) {
  const { status } = req.body;
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return sendError(res, "INVALID", "Status must be APPROVED or REJECTED", 400);
  }

  const leave = await prisma.leaveRequest.findUnique({ where: { id: req.params.id as string } });
  if (!leave) return sendError(res, "NOT_FOUND", "Leave request not found", 404);

  // If approving, update the used-leave balance on the employee profile
  if (status === "APPROVED" && leave.status === "PENDING") {
    const balanceField = leave.type === "ANNUAL" ? "usedAnnual"
      : leave.type === "SICK" ? "usedSick"
      : "usedCasual";

    await prisma.employeeProfile.updateMany({
      where: { userId: leave.userId },
      data: { [balanceField]: { increment: leave.days } },
    });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: req.params.id as string },
    data: { status },
  });
  return sendSuccess(res, updated);
}

// ─── Workforce Overview ──────────────────────────────────────

/** GET /api/workforce/overview — aggregate workforce statistics. */
export async function getWorkforceOverview(_req: Request, res: Response) {
  const profiles = await prisma.employeeProfile.findMany({
    include: { dept: { select: { name: true } } },
  });

  const headcount = profiles.length;
  const active = profiles.filter((p) => p.status === "ACTIVE").length;
  const onLeave = profiles.filter((p) => p.status === "ON_LEAVE").length;
  const presentToday = active; // Simplified; could integrate attendance

  const pendingLeave = await prisma.leaveRequest.count({ where: { status: "PENDING" } });
  const openTasks = await prisma.workTask.count({ where: { stage: { not: "DONE" } } });

  // Group by status
  const statusMap = new Map<string, number>();
  for (const p of profiles) {
    statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
  }
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

  // Group by type
  const typeMap = new Map<string, number>();
  for (const p of profiles) {
    typeMap.set(p.type, (typeMap.get(p.type) ?? 0) + 1);
  }
  const byType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));

  // Group by department
  const deptMap = new Map<string | null, { department: string; count: number }>();
  for (const p of profiles) {
    const key = p.departmentId;
    const label = p.dept?.name ?? "Unassigned";
    const entry = deptMap.get(key) ?? { department: label, count: 0 };
    entry.count++;
    deptMap.set(key, entry);
  }
  const byDepartment = Array.from(deptMap.entries()).map(([departmentId, v]) => ({
    departmentId,
    department: v.department,
    count: v.count,
  }));

  return sendSuccess(res, {
    headcount,
    active,
    onLeave,
    presentToday,
    pendingLeave,
    openTasks,
    byStatus,
    byType,
    byDepartment,
  });
}

// ─── Departments ─────────────────────────────────────────────

/** GET /api/departments */
export async function listDepartments(_req: Request, res: Response) {
  const departments = await prisma.department.findMany({
    include: { _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  });
  const data = departments.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    description: d.description,
    headId: d.headId,
    headName: d.headName,
    employeeCount: d._count.employees,
    createdAt: d.createdAt.toISOString(),
  }));
  return sendSuccess(res, data);
}

/** POST /api/departments */
export async function createDepartment(req: Request, res: Response) {
  const { name, code, description, headId, headName } = req.body;
  const dept = await prisma.department.create({
    data: { name, code, description, headId, headName },
    include: { _count: { select: { employees: true } } },
  });
  return sendSuccess(res, { ...dept, employeeCount: dept._count.employees }, undefined, 201);
}

/** PATCH /api/departments/:id */
export async function updateDepartment(req: Request, res: Response) {
  const data: Record<string, unknown> = {};
  for (const key of ["name", "code", "description", "headId", "headName"] as const) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const dept = await prisma.department.update({
    where: { id: req.params.id as string },
    data,
    include: { _count: { select: { employees: true } } },
  });
  return sendSuccess(res, { ...dept, employeeCount: dept._count.employees });
}

/** DELETE /api/departments/:id */
export async function deleteDepartment(req: Request, res: Response) {
  await prisma.department.delete({ where: { id: req.params.id as string } });
  return sendSuccess(res, { deleted: true });
}

// ─── Performance Reviews ─────────────────────────────────────

/** POST /api/employees/:id/reviews */
export async function addReview(req: Request, res: Response) {
  const { period, rating, strengths, improvements } = req.body;
  const review = await prisma.performanceReview.create({
    data: {
      userId: req.params.id as string,
      reviewerId: req.currentUser?.id ?? null,
      period,
      rating: Number(rating),
      strengths: strengths ?? null,
      improvements: improvements ?? null,
    },
  });
  return sendSuccess(res, review, undefined, 201);
}

// ─── Goals ───────────────────────────────────────────────────

/** POST /api/employees/:id/goals */
export async function addGoal(req: Request, res: Response) {
  const { title, description, dueDate } = req.body;
  const goal = await prisma.goal.create({
    data: {
      userId: req.params.id as string,
      title,
      description: description ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  return sendSuccess(res, goal, undefined, 201);
}

/** PATCH /api/goals/:id */
export async function updateGoal(req: Request, res: Response) {
  const data: Record<string, unknown> = {};
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.description !== undefined) data.description = req.body.description;
  if (req.body.progress !== undefined) data.progress = Number(req.body.progress);
  if (req.body.status !== undefined) data.status = req.body.status;
  if (req.body.dueDate !== undefined) data.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;

  const goal = await prisma.goal.update({ where: { id: req.params.id as string }, data });
  return sendSuccess(res, goal);
}

/** DELETE /api/goals/:id */
export async function deleteGoal(req: Request, res: Response) {
  await prisma.goal.delete({ where: { id: req.params.id as string } });
  return sendSuccess(res, { deleted: true });
}

// ─── Onboarding ──────────────────────────────────────────────

/** POST /api/employees/:id/onboarding */
export async function addOnboarding(req: Request, res: Response) {
  const { label, order } = req.body;
  const task = await prisma.onboardingTask.create({
    data: {
      userId: req.params.id as string,
      label,
      order: order ?? 0,
    },
  });
  return sendSuccess(res, task, undefined, 201);
}

/** PATCH /api/onboarding/:id */
export async function updateOnboarding(req: Request, res: Response) {
  const data: Record<string, unknown> = {};
  if (req.body.label !== undefined) data.label = req.body.label;
  if (req.body.done !== undefined) data.done = req.body.done;
  if (req.body.order !== undefined) data.order = Number(req.body.order);

  const task = await prisma.onboardingTask.update({ where: { id: req.params.id as string }, data });
  return sendSuccess(res, task);
}

// ─── Payslips ────────────────────────────────────────────────

/** POST /api/employees/:id/payslips */
export async function addPayslip(req: Request, res: Response) {
  const { month, gross, deductions, net, currency, notes } = req.body;
  const payslip = await prisma.payslip.create({
    data: {
      userId: req.params.id as string,
      month,
      gross: Number(gross),
      deductions: Number(deductions),
      net: Number(net),
      currency: currency ?? "INR",
      notes: notes ?? null,
    },
  });
  return sendSuccess(res, payslip, undefined, 201);
}

// ─── Announcements ───────────────────────────────────────────

/** GET /api/announcements */
export async function listAnnouncements(_req: Request, res: Response) {
  const items = await prisma.announcement.findMany({
    include: {
      department: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return sendSuccess(res, items);
}

/** POST /api/announcements */
export async function createAnnouncement(req: Request, res: Response) {
  const { title, body, audience, departmentId } = req.body;
  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      audience: audience ?? "ALL",
      departmentId: departmentId ?? null,
      createdById: req.currentUser?.id ?? null,
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });
  return sendSuccess(res, announcement, undefined, 201);
}

/** DELETE /api/announcements/:id */
export async function deleteAnnouncement(req: Request, res: Response) {
  await prisma.announcement.delete({ where: { id: req.params.id as string } });
  return sendSuccess(res, { deleted: true });
}

// ─── Self-service (authenticated employee) ───────────────────

/** GET /api/me/workspace — current user's employee workspace. */
export async function getMyWorkspace(req: Request, res: Response) {
  const userId = req.currentUser?.id;
  if (!userId) return sendError(res, "UNAUTHORIZED", "Not authenticated", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employeeProfile: { include: { dept: { select: { id: true, name: true, code: true } } } },
      workTasks: { orderBy: { createdAt: "desc" } },
      leaveRequests: { orderBy: { createdAt: "desc" } },
      goals: { orderBy: { createdAt: "desc" } },
      onboardingTasks: { orderBy: { order: "asc" } },
      payslips: { orderBy: { issuedAt: "desc" } },
      reviewsReceived: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) return sendError(res, "NOT_FOUND", "User not found", 404);

  return sendSuccess(res, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt.toISOString(),
    employeeProfile: user.employeeProfile,
    workTasks: user.workTasks,
    leaveRequests: user.leaveRequests,
    goals: user.goals,
    onboardingTasks: user.onboardingTasks,
    payslips: user.payslips,
    reviewsReceived: user.reviewsReceived,
    attendanceDays: [],
  });
}

/** POST /api/me/leave — employee submits a leave request (verifying balances). */
export async function requestLeave(req: Request, res: Response) {
  const userId = req.currentUser?.id;
  if (!userId) return sendError(res, "UNAUTHORIZED", "Not authenticated", 401);

  const { type, fromDate, toDate, days, reason } = req.body;

  // Verify leave balance
  const profile = await prisma.employeeProfile.findUnique({ where: { userId } });
  if (!profile) return sendError(res, "NO_PROFILE", "Employee profile not found", 404);

  const balanceField = type === "ANNUAL" ? "annual"
    : type === "SICK" ? "sick"
    : "casual";
  const usedField = type === "ANNUAL" ? "usedAnnual"
    : type === "SICK" ? "usedSick"
    : "usedCasual";

  const remaining = (profile[balanceField] as number) - (profile[usedField] as number);
  if (Number(days) > remaining) {
    return sendError(res, "INSUFFICIENT_BALANCE", `Only ${remaining} ${type.toLowerCase()} leave days remaining`, 400);
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      userId,
      type,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      days: Number(days),
      reason: reason ?? null,
    },
  });
  return sendSuccess(res, leave, undefined, 201);
}

/** GET /api/me/payslips */
export async function getMyPayslips(req: Request, res: Response) {
  const userId = req.currentUser?.id;
  if (!userId) return sendError(res, "UNAUTHORIZED", "Not authenticated", 401);

  const payslips = await prisma.payslip.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
  });
  return sendSuccess(res, payslips);
}

/** PATCH /api/me/onboarding/:id */
export async function updateMyOnboarding(req: Request, res: Response) {
  const userId = req.currentUser?.id;
  if (!userId) return sendError(res, "UNAUTHORIZED", "Not authenticated", 401);

  const task = await prisma.onboardingTask.findUnique({ where: { id: req.params.id as string } });
  if (!task || task.userId !== userId) {
    return sendError(res, "NOT_FOUND", "Onboarding task not found", 404);
  }

  const updated = await prisma.onboardingTask.update({
    where: { id: req.params.id as string },
    data: { done: req.body.done },
  });
  return sendSuccess(res, updated);
}

/** PATCH /api/me/goals/:id */
export async function updateMyGoal(req: Request, res: Response) {
  const userId = req.currentUser?.id;
  if (!userId) return sendError(res, "UNAUTHORIZED", "Not authenticated", 401);

  const goal = await prisma.goal.findUnique({ where: { id: req.params.id as string } });
  if (!goal || goal.userId !== userId) {
    return sendError(res, "NOT_FOUND", "Goal not found", 404);
  }

  const updated = await prisma.goal.update({
    where: { id: req.params.id as string },
    data: { progress: Number(req.body.progress) },
  });
  return sendSuccess(res, updated);
}
