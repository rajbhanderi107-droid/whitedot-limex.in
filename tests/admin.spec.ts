import { test, expect } from "@playwright/test";

test.describe("Admin Portal End-to-End and Google Sync Dashboard Verification", () => {
  
  test.beforeEach(async ({ page }) => {
    // Intercept Google Config
    await page.route("**/api/auth/google/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ enabled: true, clientId: "mock-client-id-123" }),
      });
    });

    // Intercept Auth status check (default to not authenticated)
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Not logged in" } }),
      });
    });
  });

  test("should render admin login page and handle credentials input validation", async ({ page }) => {
    await page.goto("/#/admin/login");

    // Check header
    await expect(page.locator("h1")).toContainText("White Dot Admin");
    await expect(page.locator(".adm-login-card p").first()).toContainText("Sign in to manage leads");

    // Check form fields
    const emailInput = page.locator("input[type='email']");
    const passwordInput = page.locator("input[type='password']");
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check Google Login button is rendered
    const googleButton = page.locator("button[aria-label='Sign in with Google']");
    await expect(googleButton).toBeVisible();
  });

  test("should successfully log in and redirect to dashboard", async ({ page }) => {
    // Intercept successful login
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-123",
            name: "Test Admin",
            email: "admin@whitedot.in",
            role: "SUPER_ADMIN",
            token: "mock-jwt-token-value",
          },
        }),
      });
    });

    // Once logged in, /api/auth/me should return the logged-in user
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "test-user-123",
            name: "Test Admin",
            email: "admin@whitedot.in",
            role: "SUPER_ADMIN",
          },
        }),
      });
    });

    // Intercept CommandCenter dashboard metrics
    await page.route("**/api/dashboard", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            metrics: { inquiriesCount: 5, pendingQuotesCount: 2, totalActiveClients: 10 },
            recentInquiries: [],
            threatFeed: [],
            incidents: [],
          },
        }),
      });
    });

    await page.goto("/#/admin/login");

    // Fill credentials
    await page.locator("input[type='email']").fill("admin@whitedot.in");
    await page.locator("input[type='password']").fill("superpassword123");

    // Click submit
    await page.click("button[type='submit']");

    // Should redirect to dashboard page
    await expect(page).toHaveURL(/.*\/admin\/dashboard/);
    await expect(page.locator("h1")).toContainText("Command Center");
  });

  test("should render Google Sync page dashboard components correctly", async ({ page }) => {
    // Pretend we are already logged in
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "test-user-123", name: "Test Admin", email: "admin@whitedot.in", role: "SUPER_ADMIN" },
        }),
      });
    });

    // Mock Google Overview data (with 1 connected source and 1 setup-required source)
    await page.route("**/api/google/overview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            range: "Last 28 days",
            generatedAt: new Date().toISOString(),
            sources: [
              {
                key: "logins",
                title: "Admin Logins",
                connected: true,
                metrics: [
                  { label: "Admin users", value: 3 },
                  { label: "Active users", value: 3 },
                  { label: "Logins (28d)", value: 24 },
                ],
                rowColumns: [
                  { key: "who", label: "User" },
                  { key: "action", label: "Action" },
                  { key: "when", label: "When" },
                ],
                rows: [
                  { who: "Test Admin", action: "login success", when: "2026-06-13 18:00:00" }
                ]
              },
              {
                key: "analytics",
                title: "Analytics (GA4)",
                connected: false,
                setupHint: "Set GA4_PROPERTY_ID in Render to connect.",
                consoleUrl: "https://analytics.google.com/"
              }
            ],
          },
        }),
      });
    });

    // Mock Sync Status
    await page.route("**/api/google/sync-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            lastSync: {
              id: "snap-1",
              status: "SUCCESS",
              duration: 350,
              error: null,
              createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
            },
            nextSyncAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // in 6 hours
            intervalMs: 21600000,
            intervalHuman: "Every 6 hours",
            history: [
              {
                id: "snap-1",
                status: "SUCCESS",
                duration: 350,
                error: null,
                createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
              },
              {
                id: "snap-2",
                status: "FAILED",
                duration: 120,
                error: "GA4 rate-limit exceeded",
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
              }
            ],
          },
        }),
      });
    });

    await page.goto("/#/admin/google");

    // Verify Title & Subtitle
    await expect(page.locator("h1")).toContainText("Google");
    await expect(page.locator(".adm-header p")).toContainText("Last 28 days");

    // Verify Sync Banner components
    const syncBanner = page.locator(".adm-google-sync-banner");
    await expect(syncBanner).toBeVisible();
    await expect(syncBanner).toContainText("Auto-Sync Active");
    await expect(syncBanner).toContainText("Last: 5m ago");
    await expect(syncBanner).toContainText("Next: in 5h 59m");

    // Verify manual sync and history buttons
    const syncBtn = page.locator(".adm-google-sync-btn");
    const historyBtn = page.locator("button:has-text('History')");
    await expect(syncBtn).toBeVisible();
    await expect(historyBtn).toBeVisible();

    // Verify source cards
    const cards = page.locator(".adm-google-card");
    await expect(cards).toHaveCount(2);

    // First card: Admin Logins (Connected)
    const card1 = cards.nth(0);
    await expect(card1).toContainText("Admin Logins");
    await expect(card1.locator(".adm-badge")).toContainText("Connected");
    await expect(card1).toContainText("Logins (28d)");
    await expect(card1).toContainText("24");

    // Second card: GA4 (Disconnected)
    const card2 = cards.nth(1);
    await expect(card2).toContainText("Analytics (GA4)");
    await expect(card2.locator(".adm-badge")).toContainText("Not connected");
    await expect(card2).toContainText("Set GA4_PROPERTY_ID in Render to connect.");
  });

  test("should toggle sync history timeline and trigger manual sync correctly", async ({ page }) => {
    // Pretend we are already logged in
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { id: "test-user-123", name: "Test Admin", email: "admin@whitedot.in", role: "SUPER_ADMIN" },
        }),
      });
    });

    // Mock dynamic endpoints
    await page.route("**/api/google/overview", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { range: "Last 28 days", generatedAt: new Date().toISOString(), sources: [] },
        }),
      });
    });

    await page.route("**/api/google/sync-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            lastSync: { id: "snap-1", status: "SUCCESS", duration: 150, error: null, createdAt: new Date().toISOString() },
            nextSyncAt: new Date().toISOString(),
            intervalMs: 21600000,
            intervalHuman: "Every 6 hours",
            history: [
              { id: "snap-1", status: "SUCCESS", duration: 150, error: null, createdAt: new Date().toISOString() },
              { id: "snap-2", status: "FAILED", duration: 250, error: "Network error", createdAt: new Date().toISOString() }
            ],
          },
        }),
      });
    });

    // Mock manual sync post trigger
    let manualSyncTriggered = false;
    await page.route("**/api/google/sync", async (route) => {
      manualSyncTriggered = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            sync: { status: "SUCCESS", duration: 190 },
            overview: { range: "Last 28 days", generatedAt: new Date().toISOString(), sources: [] },
          },
          message: "Google data synced successfully"
        }),
      });
    });

    await page.goto("/#/admin/google");

    // Timeline should not be visible initially
    await expect(page.locator(".adm-google-sync-history")).not.toBeVisible();

    // Toggle history timeline
    await page.click("button:has-text('History')");
    const timeline = page.locator(".adm-google-sync-history");
    await expect(timeline).toBeVisible();
    await expect(timeline).toContainText("SUCCESS");
    await expect(timeline).toContainText("FAILED");
    await expect(timeline).toContainText("Network error");

    // Hide history timeline
    await page.click("button:has-text('Hide')");
    await expect(page.locator(".adm-google-sync-history")).not.toBeVisible();

    // Trigger manual sync
    await page.click(".adm-google-sync-btn");
    expect(manualSyncTriggered).toBe(true);
  });
});
