import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

/* The four books as standalone installable apps.
 *
 * /route/, /visits/, /leads/ and /customers/ are separate entry pages with their own
 * name, icon and manifest, running the same code against the same records as
 * the portal. These checks are about the doorway, not the books themselves —
 * those are covered in books.spec.ts. */

const me = { id: "u1", name: "Test Admin", email: "admin@whitedot.in", role: "SUPER_ADMIN" };

const stop = (id: string, name: string) => ({
  id, legId: "N1", name, addr: "Plot 42, Vatva GIDC, Ahmedabad 382445", makes: "opaque tubs",
  src: "Source: test", tags: [], precise: true, map: "https://maps.example/x", tel: "9825000000",
  telLabel: "Call", link: "", linkLabel: "", fit: "prime", why: "test", sortOrder: 0,
  userAdded: false, addedById: null, addedBy: null,
});

const base = {
  fams: [{ id: "N", name: "Near Shela", blurb: "", sortOrder: 0 }],
  legs: [{ id: "N1", familyId: "N", name: "Doorstep ring", belt: "0-10 km", nav: "", sortOrder: 0 }],
  stops: [stop("N1-alpha", "Alpha Polymers")],
  marks: [], legMarks: [], views: [], prefs: {},
  settings: { id: "singleton", limexRate: 70, substitutionPct: 40, currency: "INR" },
  me: { id: me.id, name: me.name, role: me.role }, serverDay: "2026-09-07", userLeg: "M1",
};

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data }) });

async function mockApi(page: Page) {
  await page.route("**/api/**", (r) => r.fulfill(ok([])));
  await page.route("**/api/auth/google/config", (r) => r.fulfill(ok({ enabled: false, clientId: "" })));
  await page.route("**/api/auth/me", (r) => r.fulfill(ok(me)));
  await page.route("**/api/portal/route-book/bootstrap", (r) => r.fulfill(ok(base)));
  await page.route("**/api/portal/route-book/changes**", (r) =>
    r.fulfill(ok({ marks: [], stops: [], removedStopIds: [], at: new Date().toISOString() })));
  await page.route("**/api/portal/route-book/prefs", (r) => r.fulfill(ok({})));
}

/** The ?v= on an icon URL is the hash of the file it points at. */
function expectHashMatchesFile(src: string) {
  const [path, query] = src.split("?");
  const bytes = readFileSync(`public${path}`);
  const want = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  expect(query, `${path} is stale in the generated manifest — rerun scripts/build-book-apps.mjs`)
    .toBe(`v=${want}`);
}

const APPS = [
  { dir: "route", title: "LIMEX Route Book", tab: "bk-tab-route", page: "rb-page", short: "Route Book" },
  { dir: "visits", title: "LIMEX Visit Follow-ups", tab: "bk-tab-visits", page: "followup-book", short: "Visit Follow-ups" },
  { dir: "leads", title: "LIMEX Lead Book", tab: "bk-tab-leads", page: "lead-book", short: "Lead Book" },
  { dir: "customers", title: "LIMEX Customer Book", tab: "bk-tab-customers", page: "customer-book", short: "Customer Book" },
] as const;

test.describe("Standalone book apps", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("wd_admin_token", "mock-jwt");
      localStorage.removeItem("wd_rb_cache_v2");
      localStorage.removeItem("wd_rb_outbox_v2");
    });
  });

  for (const app of APPS) {
    test(`/${app.dir}/ is its own app and opens on the ${app.short}`, async ({ page }) => {
      await mockApi(page);
      await page.goto(`/${app.dir}/`);

      await expect(page).toHaveTitle(new RegExp(app.title));
      await expect(page.getByTestId("books-app")).toBeVisible();
      await expect(page.getByTestId(app.page)).toBeVisible();
      await expect(page.getByTestId("source-folder-GPT")).toBeVisible();
      await expect(page.getByTestId("source-folder-CLAUDE")).toBeVisible();
      await expect(page.getByTestId(app.tab)).toHaveClass(/is-on/);

      // Its own installable identity, not the main site's.
      const manifestHref = await page.locator("link[rel=manifest]").getAttribute("href");
      expect(manifestHref).toBe("manifest.webmanifest");
      const manifest = await page.request.get(`/${app.dir}/manifest.webmanifest`).then((r) => r.json());
      expect(manifest.start_url).toBe(`/${app.dir}/`);
      expect(manifest.scope).toBe(`/${app.dir}/`);
      expect(manifest.display).toBe("standalone");
      expect(manifest.icons.some((i: { sizes: string }) => i.sizes === "512x512")).toBe(true);
      for (const icon of manifest.icons) {
        expect((await page.request.get(icon.src)).status(), `${icon.src} must exist`).toBe(200);
        // nginx serves /assets/ as `immutable` for a year, and these filenames
        // never change — so the ?v= hash is the only thing that lets a new
        // icon reach a phone that already has the old one. If it does not
        // match the bytes on disk, the icons were rebuilt without rerunning
        // scripts/build-book-apps.mjs and the change would deploy unreachable.
        expect(icon.src, `${icon.src} must be versioned`).toMatch(/\?v=[0-9a-f]{8}$/);
        expectHashMatchesFile(icon.src);
      }
      // The portal's own sidebar has no business in a one-book app.
      await expect(page.locator(".wd-nav")).toHaveCount(0);
    });
  }

  test("the four books are one app you can move between, and the portal is one tap away", async ({ page }) => {
    await mockApi(page);
    await page.goto("/leads/");
    await expect(page.getByTestId("lead-book")).toBeVisible();

    await page.getByTestId("bk-tab-customers").click();
    await expect(page.getByTestId("customer-book")).toBeVisible();
    await expect(page.getByTestId("bk-tab-customers")).toHaveClass(/is-on/);

    await page.getByTestId("bk-tab-visits").click();
    await expect(page.getByTestId("followup-book")).toBeVisible();

    await page.getByTestId("bk-tab-route").click();
    await expect(page.getByTestId("rb-page")).toBeVisible();

    // Still the same record: this is the portal's data, not a second copy.
    await expect(page.locator(".rb-head p")).toContainText("1 sellable");
  });

  test("signed out, the app asks for the same portal login", async ({ page }) => {
    await mockApi(page);
    await page.addInitScript(() => localStorage.removeItem("wd_admin_token"));
    await page.goto("/customers/");
    await expect(page.locator("input[type=password]")).toBeVisible();
    await expect(page.getByTestId("customer-book")).toHaveCount(0);
  });

  test("fits a small phone without scrolling sideways, with four tabs", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await mockApi(page);
    await page.goto("/route/");
    await expect(page.getByTestId("books-app")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // Tab targets stay thumb-sized.
    const box = await page.getByTestId("bk-tab-route").boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });
});

test('standalone sign-in returns to the chosen book and password recovery opens', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/auth/login', r => r.fulfill(ok({ user: me, token: 'mock-jwt' })));
  await page.goto('/customers/');
  await page.getByText('Forgot password?').click();
  await expect(page.locator('input[type=email]')).toBeVisible();
  await expect(page).toHaveURL(/forgot-password/);
  await page.goto('/customers/');
  await page.locator('input[type=email]').fill('admin@whitedot.in');
  await page.locator('input[type=password]').fill('mock-password');
  await page.getByRole('button', { name: 'Sign in with email', exact: true }).click();
  await expect(page.getByTestId('customer-book')).toBeVisible();
  await expect(page).toHaveURL(/customers\/.*customer-book/);
});
