import { Hono } from 'hono';
import { db } from '../lib/db.ts';
import { sendSuccess, sendError } from '../lib/response.ts';
import { AppError } from '../lib/errors.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { hashPassword } from '../lib/password.ts';

const app = new Hono();
app.use('*', requireAuth);

const getSessionUser = (c: any) => c.get('user') as { id: string; role: string };

// ─── Employees ───────────────────────────────────────────────

// GET /employees — list all employees (users with an EmployeeProfile)
app.get('/employees', async (c) => {
  const { data: profiles, error } = await db
    .from('EmployeeProfile')
    .select(`
      *,
      user:User(id, name, email, role, isActive, createdAt),
      dept:Department(id, name, code)
    `);

  if (error) throw error;

  // For tasks count, let's fetch all tasks
  const { data: tasks } = await db.from('WorkTask').select('userId, stage');
  const taskMap: Record<string, { total: number; done: number }> = {};
  for (const t of tasks || []) {
    if (!taskMap[t.userId]) taskMap[t.userId] = { total: 0, done: 0 };
    taskMap[t.userId].total++;
    if (t.stage === 'DONE') taskMap[t.userId].done++;
  }

  const result = (profiles || []).map((p: any) => {
    const u = p.user;
    const tStats = taskMap[u?.id] || { total: 0, done: 0 };
    return {
      id: u?.id,
      name: u?.name,
      email: u?.email,
      role: u?.role,
      isActive: u?.isActive,
      jobTitle: p.workspace ?? null,
      department: p.dept?.name ?? null,
      phone: null,
      createdAt: u?.createdAt,
      employeeProfile: p,
      tasksTotal: tStats.total,
      tasksDone: tStats.done,
    };
  });

  return sendSuccess(c, result);
});

// GET /employees/:id — single employee with tasks, leave, reviews, etc.
app.get('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const { data: users, error: userError } = await db
    .from('User')
    .select(`
      id, name, email, role, isActive, createdAt,
      employeeProfile:EmployeeProfile(*, dept:Department(id, name, code))
    `)
    .eq('id', id)
    .limit(1);

  if (userError || !users || users.length === 0) {
    return sendError(c, 'NOT_FOUND', 'Employee not found', 404);
  }

  const user = users[0];

  // Fetch related records in parallel
  const [tasksRes, leaveRes, reviewsRes, goalsRes, onboardingRes, payslipsRes] = await Promise.all([
    db.from('WorkTask').select('*').eq('userId', id).order('createdAt', { ascending: false }),
    db.from('LeaveRequest').select('*').eq('userId', id).order('createdAt', { ascending: false }),
    db.from('PerformanceReview').select('*').eq('userId', id).order('createdAt', { ascending: false }),
    db.from('Goal').select('*').eq('userId', id).order('createdAt', { ascending: false }),
    db.from('OnboardingTask').select('*').eq('userId', id).order('order', { ascending: true }),
    db.from('Payslip').select('*').eq('userId', id).order('issuedAt', { ascending: false }),
  ]);

  const tasks = tasksRes.data || [];
  return sendSuccess(c, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt,
    employeeProfile: user.employeeProfile,
    workTasks: tasks,
    leaveRequests: leaveRes.data || [],
    attendanceDays: [],
    reviewsReceived: reviewsRes.data || [],
    goals: goalsRes.data || [],
    onboardingTasks: onboardingRes.data || [],
    payslips: payslipsRes.data || [],
    tasksTotal: tasks.length,
    tasksDone: tasks.filter((t: any) => t.stage === 'DONE').length,
  });
});

// POST /employees — create employee (user + profile)
app.post('/employees', async (c) => {
  const body = await c.req.json();
  const { name, email, password, role, ...profile } = body;

  const { data: exists } = await db.from('User').select('id').eq('email', email).limit(1);
  if (exists && exists.length > 0) {
    return sendError(c, 'CONFLICT', 'A user with that email already exists', 409);
  }

  const passwordHash = await hashPassword(password || 'changeme123');
  
  // Create User
  const { data: user, error: userError } = await db
    .from('User')
    .insert({
      name,
      email,
      passwordHash,
      role: role || 'EMPLOYEE',
      isActive: true,
    })
    .select()
    .single();

  if (userError) throw userError;

  // Create EmployeeProfile
  const profilePayload = {
    userId: user.id,
    location: profile.location ?? null,
    type: profile.type ?? 'FULL_TIME',
    status: profile.status ?? 'ACTIVE',
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
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString() : null,
    gender: profile.gender ?? null,
    address: profile.address ?? null,
    emergencyName: profile.emergencyName ?? null,
    emergencyPhone: profile.emergencyPhone ?? null,
    bloodGroup: profile.bloodGroup ?? null,
    bankName: profile.bankName ?? null,
    bankAccount: profile.bankAccount ?? null,
    ifsc: profile.ifsc ?? null,
    taxId: profile.taxId ?? null,
    probationEndsAt: profile.probationEndsAt ? new Date(profile.probationEndsAt).toISOString() : null,
    contractEndsAt: profile.contractEndsAt ? new Date(profile.contractEndsAt).toISOString() : null,
    weeklyHours: profile.weeklyHours ? Number(profile.weeklyHours) : null,
    currency: profile.currency ?? 'INR',
    payFrequency: profile.payFrequency ?? 'MONTHLY',
  };

  const { data: profileData, error: profileError } = await db
    .from('EmployeeProfile')
    .insert(profilePayload)
    .select()
    .single();

  if (profileError) {
    // Clean up created user if profile fails
    await db.from('User').delete().eq('id', user.id);
    throw profileError;
  }

  // Fetch created details
  const { data: dept } = await db.from('Department').select('id, name, code').eq('id', profilePayload.departmentId).limit(1);
  const deptRef = dept && dept.length > 0 ? dept[0] : null;

  return sendSuccess(c, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: profilePayload.workspace,
    department: deptRef?.name ?? null,
    phone: null,
    createdAt: user.createdAt,
    employeeProfile: {
      ...profileData,
      dept: deptRef,
    },
  }, 'Employee created', 201);
});

// PATCH /employees/:id — update user + profile
app.patch('/employees/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, email, role, isActive, password, ...profile } = body;

  const userUpdate: Record<string, any> = {};
  if (name !== undefined) userUpdate.name = name;
  if (email !== undefined) userUpdate.email = email;
  if (role !== undefined) userUpdate.role = role;
  if (isActive !== undefined) userUpdate.isActive = isActive;
  if (password) userUpdate.passwordHash = await hashPassword(password);

  if (Object.keys(userUpdate).length > 0) {
    const { error: userError } = await db.from('User').update(userUpdate).eq('id', id);
    if (userError) throw userError;
  }

  const profileUpdate: Record<string, any> = {};
  for (const [key, val] of Object.entries(profile)) {
    if (val === undefined) continue;
    if (['salary', 'kpi', 'annual', 'sick', 'casual', 'usedAnnual', 'usedSick', 'usedCasual', 'avatarHue', 'weeklyHours'].includes(key)) {
      profileUpdate[key] = val !== null ? Number(val) : null;
    } else if (['dateOfBirth', 'probationEndsAt', 'contractEndsAt', 'joinedAt'].includes(key)) {
      profileUpdate[key] = val ? new Date(val as string).toISOString() : null;
    } else {
      profileUpdate[key] = val;
    }
  }

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileError } = await db.from('EmployeeProfile').update(profileUpdate).eq('userId', id);
    if (profileError) throw profileError;
  }

  // Fetch updated employee details
  const { data: users } = await db
    .from('User')
    .select(`
      id, name, email, role, isActive, createdAt,
      employeeProfile:EmployeeProfile(*, dept:Department(id, name, code))
    `)
    .eq('id', id)
    .limit(1);

  if (!users || users.length === 0) {
    return sendError(c, 'NOT_FOUND', 'Employee not found', 404);
  }

  const user = users[0];
  return sendSuccess(c, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt,
    employeeProfile: user.employeeProfile,
  });
});

// ─── Work Tasks ──────────────────────────────────────────────

// POST /employees/:id/tasks — create a task for an employee
app.post('/employees/:id/tasks', async (c) => {
  const id = c.req.param('id');
  const { title, project, stage, priority, due } = await c.req.json();
  const { data, error } = await db
    .from('WorkTask')
    .insert({
      userId: id,
      title,
      project: project ?? null,
      stage: stage ?? 'TODO',
      priority: priority ?? 'MEDIUM',
      due: due ? new Date(due).toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, data, 'Task added', 201);
});

// PATCH /tasks/:id — update a task
app.patch('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { title, project, stage, priority, due } = body;

  const data: Record<string, any> = {};
  if (title !== undefined) data.title = title;
  if (project !== undefined) data.project = project;
  if (stage !== undefined) data.stage = stage;
  if (priority !== undefined) data.priority = priority;
  if (due !== undefined) data.due = due ? new Date(due).toISOString() : null;

  const { data: updated, error } = await db
    .from('WorkTask')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, updated);
});

// DELETE /tasks/:id — delete a task
app.delete('/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const { error } = await db.from('WorkTask').delete().eq('id', id);
  if (error) throw error;
  return sendSuccess(c, { deleted: true });
});

// ─── Leave ───────────────────────────────────────────────────

// PATCH /leave/:id — approve or reject a leave request
app.patch('/leave/:id', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return sendError(c, 'INVALID', 'Status must be APPROVED or REJECTED', 400);
  }

  const { data: leaves } = await db.from('LeaveRequest').select('*').eq('id', id).limit(1);
  if (!leaves || leaves.length === 0) {
    return sendError(c, 'NOT_FOUND', 'Leave request not found', 404);
  }
  const leave = leaves[0];

  if (status === 'APPROVED' && leave.status === 'PENDING') {
    const balanceField = leave.type === 'ANNUAL' ? 'usedAnnual'
      : leave.type === 'SICK' ? 'usedSick'
      : 'usedCasual';

    const { data: profiles } = await db.from('EmployeeProfile').select('*').eq('userId', leave.userId).limit(1);
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      const currentVal = profile[balanceField] || 0;
      await db
        .from('EmployeeProfile')
        .update({ [balanceField]: currentVal + leave.days })
        .eq('userId', leave.userId);
    }
  }

  const { data: updated, error } = await db
    .from('LeaveRequest')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, updated);
});

// ─── Workforce Overview ──────────────────────────────────────

// GET /workforce/overview — aggregate workforce statistics
app.get('/workforce/overview', async (c) => {
  const [profilesRes, leaveCountRes, openTasksCountRes] = await Promise.all([
    db.from('EmployeeProfile').select('*, dept:Department(name)'),
    db.from('LeaveRequest').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    db.from('WorkTask').select('id', { count: 'exact', head: true }).neq('stage', 'DONE'),
  ]);

  const profiles = profilesRes.data || [];
  const headcount = profiles.length;
  const active = profiles.filter((p: any) => p.status === 'ACTIVE').length;
  const onLeave = profiles.filter((p: any) => p.status === 'ON_LEAVE').length;
  const presentToday = active; // Simplified

  const pendingLeave = leaveCountRes.count ?? 0;
  const openTasks = openTasksCountRes.count ?? 0;

  // Group status
  const statusMap: Record<string, number> = {};
  for (const p of profiles) {
    statusMap[p.status] = (statusMap[p.status] || 0) + 1;
  }
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // Group type
  const typeMap: Record<string, number> = {};
  for (const p of profiles) {
    typeMap[p.type] = (typeMap[p.type] || 0) + 1;
  }
  const byType = Object.entries(typeMap).map(([type, count]) => ({ type, count }));

  // Group department
  const deptMap: Record<string, { department: string; count: number }> = {};
  for (const p of profiles) {
    const key = p.departmentId || 'unassigned';
    const label = p.dept?.name || 'Unassigned';
    if (!deptMap[key]) deptMap[key] = { department: label, count: 0 };
    deptMap[key].count++;
  }
  const byDepartment = Object.entries(deptMap).map(([departmentId, v]) => ({
    departmentId: departmentId === 'unassigned' ? null : departmentId,
    department: v.department,
    count: v.count,
  }));

  return sendSuccess(c, {
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
});

// ─── Departments ─────────────────────────────────────────────

// GET /departments
app.get('/departments', async (c) => {
  const { data: departments, error } = await db.from('Department').select('*').order('name', { ascending: true });
  if (error) throw error;

  const { data: profiles } = await db.from('EmployeeProfile').select('departmentId');
  const countMap: Record<string, number> = {};
  for (const p of profiles || []) {
    if (p.departmentId) {
      countMap[p.departmentId] = (countMap[p.departmentId] || 0) + 1;
    }
  }

  const data = (departments || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    description: d.description,
    headId: d.headId,
    headName: null,
    employeeCount: countMap[d.id] || 0,
    createdAt: d.createdAt,
  }));

  return sendSuccess(c, data);
});

// POST /departments
app.post('/departments', async (c) => {
  const { name, code, description, headId } = await c.req.json();
  const { data, error } = await db
    .from('Department')
    .insert({ name, code, description, headId })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, { ...data, employeeCount: 0 }, 'Department created', 201);
});

// PATCH /departments/:id
app.patch('/departments/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const data: Record<string, any> = {};
  for (const key of ['name', 'code', 'description', 'headId']) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const { data: updated, error } = await db
    .from('Department')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Get employee count
  const { count } = await db.from('EmployeeProfile').select('id', { count: 'exact', head: true }).eq('departmentId', id);

  return sendSuccess(c, { ...updated, employeeCount: count || 0 });
});

// DELETE /departments/:id
app.delete('/departments/:id', async (c) => {
  const id = c.req.param('id');
  const { error } = await db.from('Department').delete().eq('id', id);
  if (error) throw error;
  return sendSuccess(c, { deleted: true });
});

// ─── Performance Reviews ─────────────────────────────────────

// POST /employees/:id/reviews
app.post('/employees/:id/reviews', async (c) => {
  const id = c.req.param('id');
  const reviewer = getSessionUser(c);
  const { period, rating, strengths, improvements } = await c.req.json();

  const { data, error } = await db
    .from('PerformanceReview')
    .insert({
      userId: id,
      reviewerId: reviewer?.id || null,
      period,
      rating: Number(rating),
      strengths: strengths ?? null,
      improvements: improvements ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, data, 'Performance review added', 201);
});

// ─── Goals ───────────────────────────────────────────────────

// POST /employees/:id/goals
app.post('/employees/:id/goals', async (c) => {
  const id = c.req.param('id');
  const { title, description, dueDate } = await c.req.json();

  const { data, error } = await db
    .from('Goal')
    .insert({
      userId: id,
      title,
      description: description ?? null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, data, 'Goal created', 201);
});

// PATCH /goals/:id
app.patch('/goals/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const data: Record<string, any> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.progress !== undefined) data.progress = Number(body.progress);
  if (body.status !== undefined) data.status = body.status;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null;

  const { data: updated, error } = await db
    .from('Goal')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, updated);
});

// DELETE /goals/:id
app.delete('/goals/:id', async (c) => {
  const id = c.req.param('id');
  const { error } = await db.from('Goal').delete().eq('id', id);
  if (error) throw error;
  return sendSuccess(c, { deleted: true });
});

// ─── Onboarding ──────────────────────────────────────────────

// POST /employees/:id/onboarding
app.post('/employees/:id/onboarding', async (c) => {
  const id = c.req.param('id');
  const { label, order } = await c.req.json();

  const { data, error } = await db
    .from('OnboardingTask')
    .insert({
      userId: id,
      label,
      order: order ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, data, 'Onboarding task added', 201);
});

// PATCH /onboarding/:id
app.patch('/onboarding/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const data: Record<string, any> = {};
  if (body.label !== undefined) data.label = body.label;
  if (body.done !== undefined) data.done = body.done;
  if (body.order !== undefined) data.order = Number(body.order);

  const { data: updated, error } = await db
    .from('OnboardingTask')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, updated);
});

// ─── Payslips ────────────────────────────────────────────────

// POST /employees/:id/payslips
app.post('/employees/:id/payslips', async (c) => {
  const id = c.req.param('id');
  const { month, gross, deductions, net, currency, notes } = await c.req.json();

  const { data, error } = await db
    .from('Payslip')
    .insert({
      userId: id,
      month,
      gross: Number(gross),
      deductions: Number(deductions),
      net: Number(net),
      currency: currency ?? 'INR',
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, data, 'Payslip added', 201);
});

// ─── Announcements ───────────────────────────────────────────

// GET /announcements
app.get('/announcements', async (c) => {
  const { data, error } = await db
    .from('Announcement')
    .select(`
      *,
      department:Department(id, name, code),
      createdBy:User(id, name)
    `)
    .order('createdAt', { ascending: false });

  if (error) throw error;
  return sendSuccess(c, data || []);
});

// POST /announcements
app.post('/announcements', async (c) => {
  const creator = getSessionUser(c);
  const { title, body, audience, departmentId } = await c.req.json();

  const { data, error } = await db
    .from('Announcement')
    .insert({
      title,
      body,
      audience: audience ?? 'ALL',
      departmentId: departmentId ?? null,
      createdById: creator?.id || null,
    })
    .select()
    .single();

  if (error) throw error;

  // Fetch populated relationships
  const { data: populated } = await db
    .from('Announcement')
    .select(`
      *,
      department:Department(id, name, code),
      createdBy:User(id, name)
    `)
    .eq('id', data.id)
    .single();

  return sendSuccess(c, populated || data, 'Announcement created', 201);
});

// DELETE /announcements/:id
app.delete('/announcements/:id', async (c) => {
  const id = c.req.param('id');
  const { error } = await db.from('Announcement').delete().eq('id', id);
  if (error) throw error;
  return sendSuccess(c, { deleted: true });
});

// ─── Self-service (authenticated employee) ───────────────────

// GET /me/workspace — current user's employee workspace
app.get('/me/workspace', async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser?.id) return sendError(c, 'UNAUTHORIZED', 'Not authenticated', 401);
  const userId = sessionUser.id;

  const { data: users, error: userError } = await db
    .from('User')
    .select(`
      id, name, email, role, isActive, createdAt,
      employeeProfile:EmployeeProfile(*, dept:Department(id, name, code))
    `)
    .eq('id', userId)
    .limit(1);

  if (userError || !users || users.length === 0) {
    return sendError(c, 'NOT_FOUND', 'User not found', 404);
  }

  const user = users[0];

  // Fetch all related records
  const [tasksRes, leaveRes, goalsRes, onboardingRes, payslipsRes, reviewsRes] = await Promise.all([
    db.from('WorkTask').select('*').eq('userId', userId).order('createdAt', { ascending: false }),
    db.from('LeaveRequest').select('*').eq('userId', userId).order('createdAt', { ascending: false }),
    db.from('Goal').select('*').eq('userId', userId).order('createdAt', { ascending: false }),
    db.from('OnboardingTask').select('*').eq('userId', userId).order('order', { ascending: true }),
    db.from('Payslip').select('*').eq('userId', userId).order('issuedAt', { ascending: false }),
    db.from('PerformanceReview').select('*').eq('userId', userId).order('createdAt', { ascending: false }),
  ]);

  return sendSuccess(c, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    jobTitle: user.employeeProfile?.workspace ?? null,
    department: user.employeeProfile?.dept?.name ?? null,
    phone: null,
    createdAt: user.createdAt,
    employeeProfile: user.employeeProfile,
    workTasks: tasksRes.data || [],
    leaveRequests: leaveRes.data || [],
    goals: goalsRes.data || [],
    onboardingTasks: onboardingRes.data || [],
    payslips: payslipsRes.data || [],
    reviewsReceived: reviewsRes.data || [],
    attendanceDays: [],
  });
});

// POST /me/leave — employee submits a leave request (verifying balances)
app.post('/me/leave', async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser?.id) return sendError(c, 'UNAUTHORIZED', 'Not authenticated', 401);
  const userId = sessionUser.id;

  const { type, fromDate, toDate, days, reason } = await c.req.json();

  // Verify leave balance
  const { data: profiles } = await db.from('EmployeeProfile').select('*').eq('userId', userId).limit(1);
  if (!profiles || profiles.length === 0) {
    return sendError(c, 'NO_PROFILE', 'Employee profile not found', 404);
  }
  const profile = profiles[0];

  const balanceField = type === 'ANNUAL' ? 'annual'
    : type === 'SICK' ? 'sick'
    : 'casual';
  const usedField = type === 'ANNUAL' ? 'usedAnnual'
    : type === 'SICK' ? 'usedSick'
    : 'usedCasual';

  const remaining = (profile[balanceField] || 0) - (profile[usedField] || 0);
  if (Number(days) > remaining) {
    return sendError(c, 'INSUFFICIENT_BALANCE', `Only ${remaining} ${type.toLowerCase()} leave days remaining`, 400);
  }

  const { data, error } = await db
    .from('LeaveRequest')
    .insert({
      userId,
      type,
      fromDate: new Date(fromDate).toISOString(),
      toDate: new Date(toDate).toISOString(),
      days: Number(days),
      reason: reason ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, data, 'Leave request submitted', 201);
});

// GET /me/payslips
app.get('/me/payslips', async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser?.id) return sendError(c, 'UNAUTHORIZED', 'Not authenticated', 401);

  const { data, error } = await db
    .from('Payslip')
    .select('*')
    .eq('userId', sessionUser.id)
    .order('issuedAt', { ascending: false });

  if (error) throw error;
  return sendSuccess(c, data || []);
});

// PATCH /me/onboarding/:id
app.patch('/me/onboarding/:id', async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser?.id) return sendError(c, 'UNAUTHORIZED', 'Not authenticated', 401);
  const taskId = c.req.param('id');
  const { done } = await c.req.json();

  const { data: tasks } = await db.from('OnboardingTask').select('*').eq('id', taskId).limit(1);
  if (!tasks || tasks.length === 0 || tasks[0].userId !== sessionUser.id) {
    return sendError(c, 'NOT_FOUND', 'Onboarding task not found', 404);
  }

  const { data: updated, error } = await db
    .from('OnboardingTask')
    .update({ done })
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, updated);
});

// PATCH /me/goals/:id
app.patch('/me/goals/:id', async (c) => {
  const sessionUser = getSessionUser(c);
  if (!sessionUser?.id) return sendError(c, 'UNAUTHORIZED', 'Not authenticated', 401);
  const goalId = c.req.param('id');
  const { progress } = await c.req.json();

  const { data: goals } = await db.from('Goal').select('*').eq('id', goalId).limit(1);
  if (!goals || goals.length === 0 || goals[0].userId !== sessionUser.id) {
    return sendError(c, 'NOT_FOUND', 'Goal not found', 404);
  }

  const { data: updated, error } = await db
    .from('Goal')
    .update({ progress: Number(progress) })
    .eq('id', goalId)
    .select()
    .single();

  if (error) throw error;
  return sendSuccess(c, updated);
});

export default app;
