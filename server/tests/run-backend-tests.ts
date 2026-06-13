// Set env vars synchronously before dynamic imports to prevent configuration errors.
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
process.env.JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-value-for-testing-purposes-only";

import test from "node:test";
import assert from "node:assert";

// Dynamic imports to ensure env vars are set first
const { prisma } = await import("../src/config/prisma.js");
const { signToken, verifyToken } = await import("../src/utils/tokens.js");
const { hashPassword, verifyPassword } = await import("../src/utils/password.js");
const { requireAuth } = await import("../src/middleware/auth.middleware.js");
const { getGoogleSyncStatus, triggerManualSync } = await import("../src/controllers/google.controller.js");
const { listInquiries, updateInquiry } = await import("../src/controllers/inquiry.controller.js");
const { createUserSchema, updateInquirySchema } = await import("../src/validators/admin.validator.js");

const isDummyDb = process.env.DATABASE_URL.includes("dummy");

if (isDummyDb) {
  console.log("=== SETUP: MOCK DATABASE LAYER ACTIVE (DATABASE_URL NOT CONFIGURED) ===");

  // Mocking Prisma Client properties directly (works with Proxies)
  (prisma as any).$queryRaw = async () => [{ '1': 1 }];
  
  // Mock User operations
  (prisma.user as any).upsert = async (args: any) => ({
    id: "test-runner-id",
    name: args.create.name,
    email: args.create.email,
    role: args.create.role,
    isActive: true,
  });

  (prisma.user as any).findUnique = async (args: any) => {
    return {
      id: args.where.id || "test-user-123",
      email: args.where.email || "test-runner@whitedot.in",
      name: "Test Runner",
      role: "SUPER_ADMIN",
      isActive: true,
    };
  };

  (prisma.user as any).count = async () => 3;

  // Mock WebsiteSetting operations
  (prisma.websiteSetting as any).upsert = async (args: any) => ({
    id: "setting-id",
    key: args.create.key,
    value: args.create.value,
    type: args.create.type,
    description: args.create.description,
  });

  (prisma.websiteSetting as any).findMany = async () => [
    { key: "google_overview_data", value: JSON.stringify({ range: "Last 28 days", generatedAt: new Date().toISOString(), sources: [] }) }
  ];

  (prisma.websiteSetting as any).findUnique = async (args: any) => {
    if (args.where.key === "google_overview_data") {
      return {
        key: "google_overview_data",
        value: JSON.stringify({ range: "Last 28 days", generatedAt: new Date().toISOString(), sources: [] })
      };
    }
    return null;
  };

  // Mock Inquiry operations
  (prisma.inquiry as any).create = async (args: any) => ({
    id: "inquiry-123",
    ...args.data,
  });

  (prisma.inquiry as any).findUnique = async (args: any) => ({
    id: args.where.id,
    name: "E2E Test Client",
    email: "e2e-test@whitedot.in",
    phone: "+918888888888",
    companyName: "WhiteDot Test Labs",
    status: "NEW",
    priority: "MEDIUM",
    createdAt: new Date(),
    updatedAt: new Date(),
    adminNotes: [],
    followUpTasks: [],
  });

  (prisma.inquiry as any).findMany = async (args: any) => [
    {
      id: "inquiry-123",
      name: "E2E Test Client",
      email: "e2e-test@whitedot.in",
      phone: "+918888888888",
      companyName: "WhiteDot Test Labs",
      status: "NEW",
      priority: "MEDIUM",
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: { id: "test-runner-id", name: "Test Runner" },
      company: null,
    }
  ];

  (prisma.inquiry as any).count = async () => 1;

  (prisma.inquiry as any).update = async (args: any) => ({
    id: args.where.id,
    name: "E2E Test Client",
    email: "e2e-test@whitedot.in",
    phone: "+918888888888",
    companyName: "WhiteDot Test Labs",
    status: args.data.status || "NEW",
    priority: args.data.priority || "MEDIUM",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  (prisma.inquiry as any).delete = async () => ({
    id: "inquiry-123",
  });

  // Mock GoogleDataSnapshot operations
  (prisma.googleDataSnapshot as any).create = async (args: any) => ({
    id: "snapshot-123",
    ...args.data,
    createdAt: new Date(),
  });

  (prisma.googleDataSnapshot as any).findFirst = async () => ({
    id: "snapshot-123",
    status: "SUCCESS",
    data: {},
    error: null,
    duration: 120,
    createdAt: new Date(),
  });

  (prisma.googleDataSnapshot as any).findMany = async () => [
    {
      id: "snapshot-123",
      status: "SUCCESS",
      duration: 120,
      error: null,
      createdAt: new Date(),
    }
  ];

  (prisma.googleDataSnapshot as any).deleteMany = async () => ({
    count: 0,
  });

  // Mock SecurityEvent operations
  (prisma.securityEvent as any).create = async (args: any) => ({
    id: "evt-123",
    ...args.data,
    createdAt: new Date(),
  });

  // Mock ActivityLog operations
  (prisma.activityLog as any).create = async (args: any) => ({
    id: "log-123",
    ...args.data,
    createdAt: new Date(),
  });

  (prisma.activityLog as any).count = async () => 24;

  (prisma.activityLog as any).findMany = async () => [
    { id: "log-1", action: "LOGIN_SUCCESS", createdAt: new Date(), user: { name: "Test Admin", email: "admin@whitedot.in" } }
  ];
} else {
  console.log("=== SETUP: CONNECTED TO LIVE INTEGRATION DATABASE ===");
}

test("=== STARTING 4-LEVEL STRENGTH & FUNCTIONALITY TESTS ===", async (t) => {
  
  // -------------------------------------------------------------
  // LEVEL 1: DATABASE INTEGRITY & MODEL VALIDATION (Strength Test)
  // -------------------------------------------------------------
  await t.test("Level 1: Database & Model integrity tests", async (t2) => {
    await t2.test("Database ping check", async () => {
      const result = await prisma.$queryRaw`SELECT 1`;
      assert.ok(Array.isArray(result) && result.length > 0, "Database should return query rows");
    });

    await t2.test("User model validation via upsert", async () => {
      const testEmail = "test-runner@whitedot.in";
      const pwHash = await hashPassword("super-secret-pass");
      const testUser = await prisma.user.upsert({
        where: { email: testEmail },
        update: { isActive: true, role: "SUPER_ADMIN" },
        create: {
          name: "Test Runner",
          email: testEmail,
          passwordHash: pwHash,
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
      assert.ok(testUser.id, "Upserted user should have a valid ID");
    });

    await t2.test("Zod input schemas validation", () => {
      // Test createUserSchema
      const validUser = {
        name: "Admin User",
        email: "admin-test@whitedot.in",
        password: "securepassword123",
        role: "ADMIN",
      };
      const result = createUserSchema.safeParse(validUser);
      assert.strictEqual(result.success, true, "Zod createUserSchema should pass for valid user payload");

      const invalidUser = {
        name: "",
        email: "not-an-email",
        password: "short",
        role: "UNKNOWN_ROLE",
      };
      const resultInvalid = createUserSchema.safeParse(invalidUser);
      assert.strictEqual(resultInvalid.success, false, "Zod createUserSchema should fail for invalid user payload");
    });
  });

  // -------------------------------------------------------------
  // LEVEL 2: SECURITY & SESSION PROTECTION (Strength Test)
  // -------------------------------------------------------------
  await t.test("Level 2: Security & token verification tests", async (t2) => {
    await t2.test("JWT token signing and claim verification", () => {
      const payload = { userId: "test-user-123", role: "ADMIN" };
      const token = signToken(payload);
      assert.ok(token, "Signed token should not be empty");

      const verified = verifyToken(token);
      assert.strictEqual(verified.userId, payload.userId, "Verified token userId should match signature payload");
      assert.strictEqual(verified.role, payload.role, "Verified token role should match signature payload");
    });

    await t2.test("Password hashing and comparison integrity", async () => {
      const plainText = "my-strong-password";
      const hash = await hashPassword(plainText);
      assert.ok(hash, "Password hash should be successfully generated");
      assert.notStrictEqual(hash, plainText, "Hash should not match plaintext password");

      const match = await verifyPassword(plainText, hash);
      assert.strictEqual(match, true, "Plaintext matching hash should verify successfully");

      const mismatch = await verifyPassword("wrong-password", hash);
      assert.strictEqual(mismatch, false, "Incorrect plaintext should fail verification");
    });

    await t2.test("requireAuth middleware auth success flow", async () => {
      const payload = { userId: "test-user-123", role: "SUPER_ADMIN" };
      const token = signToken(payload);

      const req: any = {
        headers: {
          authorization: `Bearer ${token}`,
        },
        ip: "127.0.0.1",
        method: "GET",
        baseUrl: "/api",
        path: "/google/sync-status",
      };
      const res: any = {};
      let nextCalled = false;
      let nextError: any = null;
      const next = (err?: any) => {
        nextCalled = true;
        nextError = err;
      };

      await requireAuth(req, res, next);
      assert.strictEqual(nextCalled, true, "requireAuth middleware should call next()");
      assert.strictEqual(nextError, undefined, "requireAuth next() should be called without errors");
      assert.ok(req.currentUser, "requireAuth should attach currentUser to request object");
      assert.strictEqual(req.currentUser.id, "test-user-123", "currentUser ID should match token payload");
    });

    await t2.test("requireAuth middleware error scenarios", async () => {
      // 1. Missing Token
      const reqMissing: any = {
        headers: {},
        ip: "127.0.0.1",
        method: "GET",
        baseUrl: "/api",
        path: "/google/sync-status",
      };
      let nextCalled = false;
      let nextError: any = null;
      const next = (err?: any) => {
        nextCalled = true;
        nextError = err;
      };

      await requireAuth(reqMissing, {}, next);
      assert.strictEqual(nextCalled, true);
      assert.ok(nextError, "Should throw error when bearer token is missing");
      assert.strictEqual(nextError.statusCode, 401, "Error code should be 401");

      // 2. Invalid/Malformed Token
      const reqInvalid: any = {
        headers: { authorization: "Bearer invalid-token-value" },
        ip: "127.0.0.1",
        method: "GET",
        baseUrl: "/api",
        path: "/google/sync-status",
      };
      nextCalled = false;
      nextError = null;

      await requireAuth(reqInvalid, {}, next);
      assert.strictEqual(nextCalled, true);
      assert.ok(nextError, "Should throw error when token is invalid");
      assert.strictEqual(nextError.statusCode, 401, "Error code should be 401");
    });
  });

  // -------------------------------------------------------------
  // LEVEL 3: ROUTE & CONTROLLER LOGIC (Functional Test)
  // -------------------------------------------------------------
  await t.test("Level 3: Public & admin endpoints controller test", async (t2) => {
    
    // Helper to create mock Express Response
    const makeMockRes = () => {
      const res: any = {};
      res.statusCode = 200;
      res.status = (code: number) => {
        res.statusCode = code;
        return res;
      };
      res.json = (body: any) => {
        res.body = body;
        return res;
      };
      return res;
    };

    await t2.test("getGoogleSyncStatus returns sync metrics", async () => {
      const req: any = { currentUser: { id: "test-user-123", role: "ADMIN" } };
      const res = makeMockRes();

      await getGoogleSyncStatus(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data, "Should return dynamic sync status payload");
      assert.ok(res.body.data.hasOwnProperty("nextSyncAt"), "Response should include nextSyncAt");
      assert.ok(Array.isArray(res.body.data.history), "Response should include sync history array");
    });

    await t2.test("triggerManualSync starts a sync and returns fresh status", async () => {
      const req: any = { currentUser: { id: "test-user-123", role: "ADMIN" } };
      const res = makeMockRes();

      await triggerManualSync(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.sync, "Response should return sync results");
      assert.ok(res.body.data.sync.hasOwnProperty("status"), "Sync result should contain status");
      assert.ok(res.body.data.sync.hasOwnProperty("duration"), "Sync result should contain duration");
    });

    await t2.test("listInquiries returns list with custom pagination limit up to 1000", async () => {
      const req: any = {
        currentUser: { id: "test-user-123", role: "ADMIN" },
        query: { page: "1", limit: "200" }
      };
      const res = makeMockRes();

      await listInquiries(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.data), "Response should include inquiries list");
      assert.strictEqual(res.body.pagination.limit, 200, "Limit should match requested page limit of 200");
    });

    await t2.test("updateInquiry updates status and priority successfully", async () => {
      const req: any = {
        currentUser: { id: "test-user-123", role: "ADMIN" },
        params: { id: "inquiry-123" },
        body: { status: "QUALIFIED", priority: "HIGH" }
      };
      const res = makeMockRes();

      await updateInquiry(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.status, "QUALIFIED");
      assert.strictEqual(res.body.data.priority, "HIGH");
    });
  });

  // -------------------------------------------------------------
  // LEVEL 4: LIVE DB INTEGRATION & TRANSACTION LIFECYCLE (Integration/Stress)
  // -------------------------------------------------------------
  await t.test("Level 4: Live DB transaction and lifecycle test", async (t2) => {
    if (isDummyDb) {
      console.log("⏭️ Skipping Level 4 live integration tests (DATABASE_URL not configured).");
      return;
    }

    await t2.test("Create, read, and delete transactional integrity", async () => {
      const testInquiryData = {
        name: "E2E Integration Test Client",
        email: "integration-test@whitedot.in",
        phone: "+918888888888",
        companyName: "WhiteDot Integration Test Labs",
        message: "Automated integration test inquiry",
        sourcePage: "integration-test-page",
      };

      // Create
      const inquiry = await prisma.inquiry.create({ data: testInquiryData });
      assert.ok(inquiry.id, "Created integration inquiry should return an ID");

      // Read
      const found = await prisma.inquiry.findUnique({ where: { id: inquiry.id } });
      assert.strictEqual(found?.name, testInquiryData.name, "Retrieved details should match created inquiry details");

      // Delete (cleanup)
      await prisma.inquiry.delete({ where: { id: inquiry.id } });
      const deleted = await prisma.inquiry.findUnique({ where: { id: inquiry.id } });
      assert.strictEqual(deleted, null, "Deleted inquiry should no longer exist in DB");
    });
  });
});
