import { test, expect, type Page } from "@playwright/test";

/* LIMEX Route Book — runs against a mocked /api/portal/route-book so it
 * needs no backend. Mirrors the shapes in src/admin/routebook/types.ts. */

const me = { id: "u1", name: "Test Admin", email: "admin@whitedot.in", role: "SUPER_ADMIN" };
const stop = (id: string, legId: string, name: string, fit = "good", extra: Record<string, unknown> = {}) => ({
  id, legId, name, addr: `Plot ${id.length}, Vatva GIDC, Ahmedabad 382445`, makes: "opaque tubs", src: "Source: test",
  tags: [{ t: "Thin Wall", c: "" }], precise: true, map: "https://www.google.com/maps/search/?api=1&query=x", tel: "9825000000",
  telLabel: "Call", link: "", linkLabel: "", fit, why: "test", sortOrder: 0, userAdded: false, addedById: null, addedBy: null, ...extra,
});
const bootstrap = {
  fams: [{ id: "N", name: "Near Shela", blurb: "Nearest first.", sortOrder: 0 }, { id: "M", name: "Added on the road", blurb: "", sortOrder: 1 }],
  legs: [{ id: "N1", familyId: "N", name: "Doorstep ring", belt: "0-10 km", nav: "", sortOrder: 0 }, { id: "M1", familyId: "M", name: "Your own additions", belt: "", nav: "", sortOrder: 1 }],
  stops: [stop("N1-alpha", "N1", "Alpha Polymers", "prime"), stop("N1-beta", "N1", "Beta Plast"), stop("N1-beta2", "N1", "Beta Plast Pvt Ltd"), stop("N1-gamma", "N1", "Gamma Containers", "weak")],
  marks: [] as Record<string, unknown>[], legMarks: [], views: [], prefs: {}, me: { id: me.id, name: me.name, role: me.role }, serverDay: "2026-09-03", userLeg: "M1",
};
const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data }) });

async function mockPortal(page: Page) {
  const marks = new Map<string, Record<string, unknown>>();
  const events: Record<string, unknown>[] = [];
  // Playwright matches the LAST registered route first, so this catch-all
  // must be registered before the specific mocks below.
  await page.route("**/api/**", (r) => r.fulfill(ok([])));
  await page.route("**/api/auth/google/config", (r) => r.fulfill(ok({ enabled: false, clientId: "" })));
  await page.route("**/api/auth/me", (r) => r.fulfill(ok(me)));
  await page.route("**/api/dashboard", (r) => r.fulfill(ok({ totalInquiries: 0, newInquiries: 0, totalQuoteRequests: 0, newQuoteRequests: 0, totalSampleRequests: 0, totalCalculatorSubmissions: 0, totalCompanies: 0, pendingFollowUps: 0, inquiriesByStatus: {}, recentInquiries: [] })));
  await page.route("**/api/portal/state", (r) => r.fulfill(ok({ id: "singleton", automationMode: "OFF", emergencyStop: false, updatedAt: "" })));
  await page.route("**/api/portal/route-book/bootstrap", (r) => r.fulfill(ok({ ...bootstrap, marks: [...marks.values()] })));
  await page.route("**/api/portal/route-book/summary", (r) => r.fulfill(ok({ total: 4, sellable: 4, ticked: marks.size, tickedWeek: 0, interested: 0, samples: 0, starred: 0, dueToday: 0, lastEvent: null })));
  await page.route("**/api/portal/route-book/days", (r) => r.fulfill(ok({ "2026-09-03": { tick: events.filter((e) => e.kind === "tick").length } })));
  await page.route("**/api/portal/route-book/events**", (r) => r.fulfill(ok(events)));
  await page.route("**/api/portal/route-book/marks/bulk", async (r) => {
    const body = r.request().postDataJSON() as { day: string; items: { stopId: string; [k: string]: unknown }[] };
    const outRows = body.items.map(({ stopId, ...patch }) => {
      const prev = marks.get(stopId) ?? { stopId, ticked: false, tickedOn: null, starred: false, note: null, outcome: null, dueOn: null, contactName: null, contactPhone: null, addrOverride: null, addrPrecise: null, dnc: false, removed: false, dupOf: null, snoozedOn: null, companyId: null, followUpId: null };
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString(), updatedById: me.id, updatedBy: { id: me.id, name: me.name } };
      if (patch.ticked === true && prev.ticked !== true) { events.push({ id: String(events.length), kind: "tick", value: body.day, day: body.day, at: new Date().toISOString(), stopId, legId: null, userId: me.id, user: { id: me.id, name: me.name }, stop: { name: bootstrap.stops.find((s) => s.id === stopId)?.name, legId: "N1" } }); }
      marks.set(stopId, next);
      return next;
    });
    await r.fulfill(ok(outRows));
  });
  await page.route("**/api/portal/route-book/prefs", (r) => r.fulfill(ok({})));
  await page.route("**/api/portal/route-book/views", (r) => r.fulfill(ok([])));
  await page.route("**/api/portal/route-book/stops", async (r) => {
    const body = r.request().postDataJSON() as { name: string; addr?: string };
    await r.fulfill({ ...ok(stop("own-1", "M1", body.name, "good", { addr: body.addr ?? "", userAdded: true, addedById: me.id, addedBy: { name: me.name } })), status: 201 });
  });
  await page.route("**/api/notifications**", (r) => r.fulfill(ok([])));
  return { marks, events };
}

test.describe("LIMEX Route Book", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem("wd_admin_token", "mock-jwt"); localStorage.removeItem("wd_rb_cache_v2"); localStorage.removeItem("wd_rb_outbox_v2"); });
  });

  test("appears in the sidebar and on the Command Center, and loads the book", async ({ page }) => {
    await mockPortal(page);
    await page.goto("/#/admin/dashboard");
    await expect(page.locator(".wd-kpi:has-text('Route Book')")).toBeVisible();
    await page.locator(".wd-nav a:has-text('LIMEX Route Book')").first().click();
    await expect(page.getByTestId("rb-page")).toBeVisible();
    await expect(page.locator(".rb-head p")).toContainText("4 sellable companies");
    await expect(page.getByTestId("rb-leg")).toHaveCount(1);
  });

  test("tick, outcome, note and undo round-trip through the API", async ({ page }) => {
    const mock = await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    const card = page.getByTestId("rb-stop").first();
    await card.getByTestId("rb-tick").click();
    await expect(card).toHaveClass(/is-ticked/);
    await expect.poll(() => mock.marks.get("N1-alpha")?.ticked, { timeout: 5000 }).toBe(true);
    await page.getByTestId("rb-undo").first().click();
    await expect(card).not.toHaveClass(/is-ticked/);
    await expect.poll(() => mock.marks.get("N1-alpha")?.ticked, { timeout: 5000 }).toBe(false);

    await card.locator(".rb-ochip[data-out='int']").click();
    await expect(card).toHaveClass(/is-ticked/); // an outcome implies a visit
    await card.getByTestId("rb-note-btn").click();
    await card.locator("textarea").fill("Owner wants a 2 kg sample");
    await card.getByTestId("rb-save").click();
    await expect(card.locator(".rb-note")).toContainText("2 kg sample");
    await expect.poll(() => mock.marks.get("N1-alpha")?.note, { timeout: 5000 }).toBe("Owner wants a 2 kg sample");
  });

  test("remove hides a company until the Removed chip reveals it, then restore", async ({ page }) => {
    const mock = await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    const beta = page.locator("[data-testid='rb-stop'][data-id='N1-beta']");
    await beta.getByTestId("rb-remove").click();
    await expect(beta).toHaveCount(0);
    await expect.poll(() => mock.marks.get("N1-beta")?.removed, { timeout: 5000 }).toBe(true);
    await page.getByTestId("rb-chip-removed").click();
    await expect(beta).toHaveClass(/is-removed/);
    await expect(beta.getByTestId("rb-remove")).toContainText("Restore");
    await beta.getByTestId("rb-remove").click();
    await page.getByTestId("rb-chip-removed").click();
    await expect(beta).toBeVisible();
    await expect(beta).not.toHaveClass(/is-removed/);
  });

  test("search, Stops view export, Days record and Pipeline duplicates", async ({ page }) => {
    await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-search").fill("gamma");
    await expect(page.locator(".rb-showing")).toHaveText("1 of 4");
    await page.getByTestId("rb-clear").click();

    await page.getByTestId("rb-tab-all").click();
    await expect(page.locator(".rb-count")).toHaveText("4 showing");
    const dl = page.waitForEvent("download");
    await page.getByText("Export this view").click();
    expect((await dl).suggestedFilename()).toMatch(/^limex-view-\d{4}-\d{2}-\d{2}\.csv$/);

    await page.getByTestId("rb-tab-pipe").click();
    await expect(page.locator(".rb-dsec:has-text('Likely duplicates') .rb-drow")).toHaveCount(1); // Beta Plast × 2
    await expect(page.locator(".rb-dsec:has-text('Where to go next')")).toBeVisible();

    await page.getByTestId("rb-tab-plan").click();
    await expect(page.locator(".rb-days")).toContainText("Today’s run");
  });

  test("call queue steps through stops and Escape closes it", async ({ page }) => {
    await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-tab-all").click();
    await page.getByText("Call queue").first().click();
    const q = page.getByTestId("rb-queue");
    await expect(q.locator(".rb-qcount")).toHaveText("1 of 4");
    await q.locator(".rb-qtick").click();
    await expect(q.locator(".rb-qcount")).toHaveText("2 of 4");
    await page.keyboard.press("Escape");
    await expect(q).toHaveCount(0);
  });

  test("adds a company found on the road into its own leg", async ({ page }) => {
    await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-addbtn").click();
    await page.locator("[data-testid='rb-add'] input").first().fill("Roadside Plast");
    await page.getByText("Add to the book").click();
    await expect(page.locator("[data-testid='rb-stop']:has-text('Roadside Plast')")).toBeVisible();
    await expect(page.locator("[data-testid='rb-stop']:has-text('Roadside Plast') .rb-pill-big")).toContainText("Yours");
  });

  test("works on a phone: nothing overflows, filters behind a button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await expect(page.getByTestId("rb-page")).toBeVisible();

    // Scoped to the Route Book's own subtree on purpose: the portal shell's
    // .wd-topbar-right (automation selector, emergency stop, bell) overflows
    // 390px on every admin page, which is a pre-existing shell issue, not this
    // module's. Assert what this module owns.
    const overflowing = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const page_ = document.querySelector(".rb-page");
      if (!page_) return ["no .rb-page"];
      return [...page_.querySelectorAll("*")]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > vw + 1 || r.left < -1);
        })
        .slice(0, 5)
        .map((el) => `${el.tagName}.${el.className}`);
    });
    expect(overflowing).toEqual([]);

    await expect(page.locator(".rb-rail")).toBeHidden();
    await page.locator(".rb-railbtn").click();
    await expect(page.locator(".rb-rail")).toBeVisible();
  });
});
