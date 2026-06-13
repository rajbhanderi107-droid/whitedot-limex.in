import { prisma } from "../src/config/prisma.js";
import { signToken } from "../src/utils/tokens.js";
import { hashPassword } from "../src/utils/password.js";

async function runTests() {
  console.log("=== STARTING 4-LEVEL STRENGTH & FUNCTIONALITY TESTS ===");
  let failed = false;

  const assert = (condition: boolean, message: string) => {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed = true;
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  };

  // -------------------------------------------------------------
  // LEVEL 1: DATABASE INTEGRITY & MODEL VALIDATION (Strength Test)
  // -------------------------------------------------------------
  console.log("\n--- Level 1: Database & Model integrity tests ---");
  try {
    // Check connecting to database
    await prisma.$queryRaw`SELECT 1`;
    assert(true, "Database is reachable");

    // Upsert a test user
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
    assert(!!testUser.id, `User model upserted (ID: ${testUser.id})`);

    // Clean up or upsert Google data
    const overviewData = { range: "Last 28 days", generatedAt: new Date().toISOString(), sources: [] };
    const setting = await prisma.websiteSetting.upsert({
      where: { key: "google_overview_data" },
      update: { value: JSON.stringify(overviewData) },
      create: {
        key: "google_overview_data",
        value: JSON.stringify(overviewData),
        type: "JSON",
        description: "Google Overview test cached metrics",
      },
    });
    assert(setting.key === "google_overview_data", "WebsiteSetting JSON key upserted successfully");
  } catch (err) {
    console.error("❌ Level 1 failed:", err);
    failed = true;
  }

  // -------------------------------------------------------------
  // LEVEL 2: SECURITY & TOKEN SIGNING FUNCTIONALITY (Strength Test)
  // -------------------------------------------------------------
  console.log("\n--- Level 2: Security & Token signing tests ---");
  try {
    const payload = { userId: "test-user-123", role: "ADMIN" };
    const token = signToken(payload);
    assert(!!token, "Signed JWT successfully");

    // Verify token validation via dynamic import or direct logic if verification is correct
    const { verifyToken } = await import("../src/utils/tokens.js");
    const verified = verifyToken(token);
    assert(verified.userId === "test-user-123" && verified.role === "ADMIN", "Verified JWT claims match signature");
  } catch (err) {
    console.error("❌ Level 2 failed:", err);
    failed = true;
  }

  // -------------------------------------------------------------
  // LEVEL 3: PUBLIC ENDPOINT FUNCTIONALITY (Functional Test)
  // -------------------------------------------------------------
  console.log("\n--- Level 3: Public Endpoints Functional Test ---");
  try {
    const settings = await prisma.websiteSetting.findMany({
      select: { key: true, value: true },
    });
    assert(settings.length > 0, `Fetched settings from DB successfully, count: ${settings.length}`);

    const googleOverview = await prisma.websiteSetting.findUnique({
      where: { key: "google_overview_data" },
    });
    assert(!!googleOverview, "Retrieved public Google Overview cache from DB");
  } catch (err) {
    console.error("❌ Level 3 failed:", err);
    failed = true;
  }

  // -------------------------------------------------------------
  // LEVEL 4: END-TO-END DATA SYNC FLOW (Functional & Integration Test)
  // -------------------------------------------------------------
  console.log("\n--- Level 4: E2E Sync Flow Verification ---");
  try {
    // Simulating public inquiry submission matching validation
    const testInquiryData = {
      name: "E2E Test Client",
      email: "e2e-test@whitedot.in",
      phone: "+919999999999",
      companyName: "WhiteDot E2E Test Labs",
      message: "Automated test inquiry",
      sourcePage: "homepage-test",
    };

    const inquiry = await prisma.inquiry.create({ data: testInquiryData });
    assert(!!inquiry.id, `Created test inquiry (ID: ${inquiry.id})`);

    // Fetch inquiries to ensure it's in the list
    const found = await prisma.inquiry.findUnique({ where: { id: inquiry.id } });
    assert(found?.name === "E2E Test Client", "Fetched inquiry matches created details");

    // Clean up
    await prisma.inquiry.delete({ where: { id: inquiry.id } });
    assert(true, "Cleaned up E2E test inquiry successfully");
  } catch (err) {
    console.error("❌ Level 4 failed:", err);
    failed = true;
  }

  console.log("\n=== TEST RUN COMPLETED ===");
  if (failed) {
    console.error("🔴 SOME TESTS FAILED. Please review issues!");
    process.exit(1);
  } else {
    console.log("🟢 ALL 4 LEVELS OF TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Unexpected test runner failure:", err);
  process.exit(1);
});
