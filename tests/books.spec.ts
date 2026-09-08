import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/* Visit Follow-ups, Lead Book and Customer Book — one record, four views.
 *
 * Runs against a mocked /api/portal/route-book that behaves the way the real
 * one does: a stage change is an ordinary mark patch, and recording an order
 * promotes the company to CUSTOMER server-side. */

const me = { id: "u1", name: "Test Admin", email: "admin@whitedot.in", role: "SUPER_ADMIN" };
const DAY = "2026-09-07";

const stop = (id: string, name: string) => ({
  id, legId: "N1", name, addr: "Plot 42, Vatva GIDC, Ahmedabad 382445", makes: "opaque tubs",
  src: "Source: test", tags: [], precise: true, map: "https://maps.example/x", tel: "9825000000",
  telLabel: "Call", link: "", linkLabel: "", fit: "prime", why: "test", sortOrder: 0,
  userAdded: false, addedById: null, addedBy: null,
});

const blank = (stopId: string) => ({
  stopId, ticked: false, tickedOn: null, starred: false, note: null, outcome: null, dueOn: null,
  contactName: null, contactPhone: null, addrOverride: null, addrPrecise: null, dnc: false, removed: false,
  dupOf: null, snoozedOn: null, companyId: null, followUpId: null,
  polymers: null, processes: null, monthlyTonnes: null, machines: null, fillerPct: null, resinRate: null,
  thinWall: null, profiledOn: null,
  stage: "PROSPECT", leadOn: null, customerOn: null, lostOn: null, lostReason: null, nextStep: null,
  expectedMt: null, quotedRate: null, gstNumber: null, billTo: null, shipTo: null, paymentTerms: null,
  inquiryId: null, samples: [], orders: [],
  updatedAt: new Date().toISOString(), updatedById: null, updatedBy: null,
});

const base = {
  fams: [{ id: "N", name: "Near Shela", blurb: "", sortOrder: 0 }, { id: "M", name: "Added on the road", blurb: "", sortOrder: 1 }],
  legs: [{ id: "N1", familyId: "N", name: "Doorstep ring", belt: "0-10 km", nav: "", sortOrder: 0 },
    { id: "M1", familyId: "M", name: "Your own additions", belt: "", nav: "", sortOrder: 1 }],
  stops: [stop("N1-alpha", "Alpha Polymers"), stop("N1-beta", "Beta Plast")],
  legMarks: [], views: [], prefs: {},
  settings: { id: "singleton", limexRate: 70, substitutionPct: 40, currency: "INR" },
  me: { id: me.id, name: me.name, role: me.role }, serverDay: DAY, userLeg: "M1",
};

const ok = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data }) });

type Mark = ReturnType<typeof blank> & Record<string, unknown>;

async function mockPortal(page: Page) {
  const marks = new Map<string, Mark>();
  const orders: Record<string, unknown>[] = [];

  const apply = (stopId: string, patch: Record<string, unknown>) => {
    const prev = marks.get(stopId) ?? blank(stopId);
    const next = { ...prev, ...patch } as Mark;
    if (patch.ticked === true && !next.tickedOn) next.tickedOn = DAY;
    // The server stamps these; the books read them back, so the mock must too.
    if (patch.stage === "LEAD" && !next.leadOn) next.leadOn = DAY;
    if (patch.stage === "CUSTOMER") { next.leadOn ??= DAY; next.customerOn ??= DAY; }
    if (patch.ticked || patch.starred || patch.stage) next.companyId ??= `c-${stopId}`;
    next.updatedAt = new Date().toISOString();
    marks.set(stopId, next);
    return next;
  };

  // Playwright matches the LAST registered route first: catch-all goes first.
  await page.route("**/api/**", (r) => r.fulfill(ok([])));
  await page.route("**/api/auth/google/config", (r) => r.fulfill(ok({ enabled: false, clientId: "" })));
  await page.route("**/api/auth/me", (r) => r.fulfill(ok(me)));
  await page.route("**/api/portal/state", (r) => r.fulfill(ok({ id: "singleton", automationMode: "OFF", emergencyStop: false, updatedAt: "" })));
  await page.route("**/api/portal/route-book/bootstrap", (r) => r.fulfill(ok({ ...base, marks: [...marks.values()] })));
  await page.route("**/api/portal/route-book/changes**", (r) =>
    r.fulfill(ok({ marks: [...marks.values()], stops: [], removedStopIds: [], at: new Date().toISOString() })));
  await page.route("**/api/portal/route-book/summary", (r) => r.fulfill(ok({
    total: 2, sellable: 2, ticked: 0, tickedWeek: 0, interested: 0, samples: 0, starred: 0, dueToday: 0,
    lastEvent: null, leads: 0, customers: 0, orders: 0, orderedMt: 0, orderedValue: null,
  })));
  await page.route("**/api/portal/route-book/marks/bulk", async (r) => {
    const body = r.request().postDataJSON() as { items: { stopId: string }[] };
    await r.fulfill(ok(body.items.map(({ stopId, ...patch }) => apply(stopId, patch))));
  });
  await page.route("**/api/portal/route-book/stops/*/orders", async (r) => {
    const stopId = decodeURIComponent(new URL(r.request().url()).pathname.split("/").slice(-2)[0]);
    const body = r.request().postDataJSON() as { quantityMt: number; rate: number | null; grade: string };
    const order = {
      id: `o${orders.length}`, stopId, orderNo: `WD-2026-000${orders.length + 1}`,
      amount: body.rate == null ? null : body.quantityMt * 1000 * body.rate,
      orderedOn: DAY, dispatchOn: null, status: "CONFIRMED", poRef: null, note: null,
      createdAt: "", createdById: me.id, createdBy: { id: me.id, name: me.name }, ...body,
    };
    orders.push(order);
    const mark = apply(stopId, { stage: "CUSTOMER", orders: orders.filter((o) => o.stopId === stopId) });
    await r.fulfill({ ...ok({ order, mark }), status: 201 });
  });
  await page.route("**/api/portal/route-book/orders/*", async (r) => {
    const id = r.request().url().split("/").pop() as string;
    const i = orders.findIndex((o) => o.id === id);
    if (i >= 0) {
      const stopId = orders[i].stopId as string;
      orders.splice(i, 1);
      apply(stopId, { orders: orders.filter((o) => o.stopId === stopId) });
    }
    await r.fulfill(ok({ id }));
  });
  await page.route("**/api/portal/route-book/prefs", (r) => r.fulfill(ok({})));
  await page.route("**/api/notifications**", (r) => r.fulfill(ok([])));
  return { marks, orders };
}

test.describe("Visit Follow-ups, Lead Book & Customer Book", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("wd_admin_token", "mock-jwt");
      localStorage.removeItem("wd_rb_cache_v2");
      localStorage.removeItem("wd_rb_outbox_v2");
    });
  });

  test("ticking a company puts it in Visit Follow-ups, and promoting takes it out", async ({ page }) => {
    const mock = await mockPortal(page);

    // 1. A tick in the Route Book is the only action. Nothing else is pressed.
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    await page.locator("[data-testid='rb-stop'][data-id='N1-alpha']").getByTestId("rb-tick").click();
    await expect.poll(() => mock.marks.get("N1-alpha")?.ticked, { timeout: 5000 }).toBe(true);

    // 2. It is already in the follow-up list — the book fills itself.
    await page.goto("/#/admin/visit-followups");
    const card = page.getByTestId("fb-card").first();
    await expect(card).toContainText("Alpha Polymers");
    await expect(page.getByTestId("fb-card")).toHaveCount(1);
    // Beta was never visited, so it must not be here.
    await expect(page.getByTestId("followup-book")).not.toContainText("Beta Plast");

    // 3. It is NOT in the Lead Book: a visit is not a deal.
    await page.goto("/#/admin/lead-book");
    await expect(page.getByTestId("lb-card")).toHaveCount(0);

    // 4. Promoting is a decision, taken here.
    await page.goto("/#/admin/visit-followups");
    await page.getByTestId("fb-promote").first().click();
    await expect.poll(() => mock.marks.get("N1-alpha")?.stage, { timeout: 5000 }).toBe("LEAD");

    // 5. Now it is a lead, and it has left the follow-up list — never in two
    //    books at once.
    await expect(page.getByTestId("fb-card")).toHaveCount(0);
    await page.goto("/#/admin/lead-book");
    await expect(page.getByTestId("lb-card").first()).toContainText("Alpha Polymers");
  });

  test("a starred company is a follow-up even before it is ticked", async ({ page }) => {
    const mock = await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    await page.locator("[data-testid='rb-stop'][data-id='N1-beta']").getByTestId("rb-star").click();
    await expect.poll(() => mock.marks.get("N1-beta")?.starred, { timeout: 5000 }).toBe(true);

    await page.goto("/#/admin/visit-followups");
    await expect(page.getByTestId("fb-card").first()).toContainText("Beta Plast");
    await expect(page.getByTestId("fb-card").first()).toContainText("starred, not yet visited");
  });

  test("a Route Book company becomes a lead, then a customer with tonnage", async ({ page }) => {
    const mock = await mockPortal(page);

    // 1. Promote from the Route Book itself.
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    const alpha = page.locator("[data-testid='rb-stop'][data-id='N1-alpha']");
    await alpha.getByTestId("rb-makelead").click();
    await expect.poll(() => mock.marks.get("N1-alpha")?.stage, { timeout: 5000 }).toBe("LEAD");

    // 2. It is waiting in the Lead Book, on the same record.
    await page.goto("/#/admin/lead-book");
    const card = page.getByTestId("lb-card").first();
    await expect(card).toContainText("Alpha Polymers");
    await expect(page.locator(".rb-hero").first()).toContainText("1");

    // 3. Fill in the deal, then win it with an order in MT.
    await card.locator("input[data-field='Expected MT / month']").fill("12.5");
    await card.locator("input[data-field='Quoted ₹ / kg']").fill("78.5");
    await card.locator("input[data-field='Next step']").fill("Send 25 kg trial");
    await card.locator("input[data-field='Next step']").blur();
    await expect.poll(() => mock.marks.get("N1-alpha")?.quotedRate, { timeout: 5000 }).toBe(78.5);
    await expect(card.locator(".rb-bstats")).toContainText("a month at 78.5/kg");

    await card.getByTestId("lb-won").click();
    const dialog = page.getByTestId("order-dialog");
    await expect(dialog.locator("input[data-testid='order-rate']")).toHaveValue("78.5"); // carried from the quote
    await dialog.getByTestId("order-grade").fill("LIMEX PP-50");
    await dialog.getByTestId("order-qty").fill("6.25");
    await expect(dialog.locator(".rb-modal-sum")).toContainText("₹4,90,625.00");
    await dialog.getByTestId("order-save").click();
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => mock.orders.length, { timeout: 5000 }).toBe(1);
    await expect.poll(() => mock.marks.get("N1-alpha")?.stage).toBe("CUSTOMER");

    // 4. It has left the Lead Book and arrived in the Customer Book.
    await expect(page.getByTestId("lb-card")).toHaveCount(0);
    await page.goto("/#/admin/customer-book");
    const cust = page.getByTestId("cb-card").first();
    await expect(cust).toContainText("Alpha Polymers");
    await expect(cust).toContainText("6.25 MT");
    await expect(cust.locator(".rb-otable tbody tr")).toHaveCount(1);
    await expect(cust.locator(".rb-otable tbody tr")).toContainText("WD-2026-0001");
    await expect(cust.locator(".rb-otable tbody tr")).toContainText("₹4,90,625.00");
  });

  test("a company recorded as a customer by mistake can be taken back out", async ({ page }) => {
    const mock = await mockPortal(page);
    page.on("dialog", (d) => void d.accept());

    // Get one company into the Customer Book the normal way.
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    await page.locator("[data-testid='rb-stop'][data-id='N1-alpha']").getByTestId("rb-makelead").click();
    await page.goto("/#/admin/lead-book");
    await page.getByTestId("lb-won").first().click();
    await page.getByTestId("order-grade").fill("Trial");
    await page.getByTestId("order-qty").fill("1");
    await page.getByTestId("order-save").click();
    await expect(page.getByTestId("order-dialog")).toHaveCount(0);

    await page.goto("/#/admin/customer-book");
    await expect(page.getByTestId("cb-card")).toHaveCount(1);
    await expect(page.locator(".rb-otable tbody tr")).toHaveCount(1);

    // Take it back out: the order goes, the company returns to the Lead Book.
    await page.getByTestId("cb-remove").click();
    await expect.poll(() => mock.marks.get("N1-alpha")?.stage, { timeout: 5000 }).toBe("LEAD");
    await expect.poll(() => mock.orders.length, { timeout: 5000 }).toBe(0);
    await expect(page.getByTestId("cb-card")).toHaveCount(0);

    // And it is waiting in the Lead Book, not lost.
    await page.goto("/#/admin/lead-book");
    await expect(page.getByTestId("lb-card")).toHaveCount(1);
    await expect(page.getByTestId("lb-card").first()).toContainText("Alpha Polymers");
  });

  test("the Customer Book exports a real Excel workbook and Word document", async ({ page }) => {
    await mockPortal(page);
    await page.goto("/#/admin/lead-book");
    // Get one customer into the book first.
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    await page.locator("[data-testid='rb-stop'][data-id='N1-beta']").getByTestId("rb-makelead").click();
    await page.goto("/#/admin/lead-book");
    await page.getByTestId("lb-won").first().click();
    await page.getByTestId("order-grade").fill("LIMEX HD-40");
    await page.getByTestId("order-qty").fill("10");
    await page.getByTestId("order-save").click();
    await expect(page.getByTestId("order-dialog")).toHaveCount(0);

    // Reloading here is the point: a patch still queued in the outbox must not
    // replay over the order the server has already accepted.
    await page.goto("/#/admin/customer-book");
    await expect(page.getByTestId("cb-card")).toHaveCount(1);
    await expect(page.locator(".rb-hero").first()).toContainText("1");
    for (const [testId, ext, sig] of [["cb-xlsx", "xlsx", "xl/workbook.xml"], ["cb-docx", "docx", "word/document.xml"]] as const) {
      const wait = page.waitForEvent("download");
      await page.getByTestId(testId).click();
      const dl = await wait;
      expect(dl.suggestedFilename()).toMatch(new RegExp(`\\.${ext}$`));
      const path = await dl.path();
      const buf = readFileSync(path);
      expect(buf.subarray(0, 2).toString()).toBe("PK");          // a real ZIP container
      expect(buf.toString("latin1")).toContain(sig);             // with the part that makes it Office
      expect(buf.toString("latin1")).toContain("Beta Plast");    // and our data inside
    }
  });

  test("both books work on a phone without scrolling sideways", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    await page.locator("[data-testid='rb-stop'][data-id='N1-alpha']").getByTestId("rb-makelead").click();

    for (const [path, testId] of [["lead-book", "lead-book"], ["customer-book", "customer-book"]] as const) {
      await page.goto(`/#/admin/${path}`);
      await expect(page.getByTestId(testId)).toBeVisible();
      // Scoped to the book itself: the portal top bar overflows on every admin
      // page and is not this module's to fix.
      const overflow = await page.locator(`[data-testid='${testId}']`).evaluate(
        (el) => Math.max(...[...el.querySelectorAll("*")].map((n) => n.scrollWidth - el.clientWidth)));
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });
});
