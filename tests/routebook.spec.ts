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
  marks: [] as Record<string, unknown>[], legMarks: [], views: [], prefs: {},
  settings: { id: "singleton", limexRate: 70, substitutionPct: 40, currency: "INR" },
  me: { id: me.id, name: me.name, role: me.role }, serverDay: "2026-09-03", userLeg: "M1",
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
  await page.route("**/api/portal/route-book/days", (r) => r.fulfill(ok({ "2026-09-03": { tick: events.filter((e) => e.kind === "tick").length } })));
  await page.route("**/api/portal/route-book/events**", (r) => r.fulfill(ok(events)));
  await page.route("**/api/portal/route-book/marks/bulk", async (r) => {
    const body = r.request().postDataJSON() as { day: string; items: { stopId: string; [k: string]: unknown }[] };
    const outRows = body.items.map(({ stopId, ...patch }) => {
      const prev = marks.get(stopId) ?? { stopId, ticked: false, tickedOn: null, starred: false, note: null, outcome: null, dueOn: null, contactName: null, contactPhone: null, addrOverride: null, addrPrecise: null, dnc: false, removed: false, dupOf: null, snoozedOn: null, companyId: null, followUpId: null, polymers: null, processes: null, monthlyTonnes: null, machines: null, fillerPct: null, resinRate: null, thinWall: null, profiledOn: null, samples: [] };
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
  const samples: Record<string, unknown>[] = [];
  let settings = { ...bootstrap.settings };
  await page.route("**/api/portal/route-book/samples/open", (r) => r.fulfill(ok(samples.filter((x) => x.result === "PENDING"))));
  await page.route("**/api/portal/route-book/stops/*/samples", async (r) => {
    const stopId = decodeURIComponent(new URL(r.request().url()).pathname.split("/").slice(-2)[0]);
    const body = r.request().postDataJSON() as Record<string, unknown>;
    const row = { id: `s${samples.length}`, stopId, result: "PENDING", resultOn: null, resultNote: null,
      contactName: null, trialDueOn: null, createdAt: "", createdById: me.id, createdBy: { id: me.id, name: me.name },
      givenOn: "2026-09-03", ...body };
    samples.push(row);
    const prev = marks.get(stopId) ?? { stopId };
    marks.set(stopId, { ...prev, ticked: true, tickedOn: "2026-09-03", outcome: "smp", samples: samples.filter((x) => x.stopId === stopId) });
    await r.fulfill({ ...ok(row), status: 201 });
  });
  await page.route("**/api/portal/route-book/samples/*", async (r) => {
    const id = r.request().url().split("/").pop() as string;
    const i = samples.findIndex((x) => x.id === id);
    if (r.request().method() === "DELETE") { samples.splice(i, 1); return r.fulfill(ok({ id })); }
    samples[i] = { ...samples[i], ...(r.request().postDataJSON() as object) };
    const stopId = samples[i].stopId as string;
    marks.set(stopId, { ...(marks.get(stopId) ?? { stopId }), samples: samples.filter((x) => x.stopId === stopId) });
    await r.fulfill(ok(samples[i]));
  });
  await page.route("**/api/portal/route-book/settings", async (r) => {
    if (r.request().method() === "PATCH") settings = { ...settings, ...(r.request().postDataJSON() as object) };
    await r.fulfill(ok(settings));
  });
  await page.route("**/api/notifications**", (r) => r.fulfill(ok([])));
  return { marks, events, samples, getSettings: () => settings };
}

test.describe("LIMEX Route Book", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem("wd_admin_token", "mock-jwt"); localStorage.removeItem("wd_rb_cache_v2"); localStorage.removeItem("wd_rb_outbox_v2"); });
  });

  test("appears in the clean workspace and loads the book", async ({ page }) => {
    await mockPortal(page);
    await page.goto("/#/admin/dashboard");
    await expect(page.locator(".bd-book:has-text('LIMEX Route Book')")).toBeVisible();
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

  test("qualifying a plant sizes the opportunity in tonnes and rupees", async ({ page }) => {
    const mock = await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    const card = page.getByTestId("rb-stop").first();

    await card.getByTestId("rb-fit-btn").click();
    await card.locator(".rb-chip", { hasText: /^PP$/ }).click();
    await card.getByTestId("rb-tonnes").fill("60");
    // 60 t/mo x 40% = 24 t of LIMEX; at the mocked 70/kg that is 16.8 lakh,
    // which inr() rounds to whole lakhs once past 10.
    await expect(card.getByTestId("rb-sizing")).toContainText("24.0 t/mo");
    await expect(card.getByTestId("rb-sizing")).toContainText("₹17 L");
    await card.getByTestId("rb-fit-save").click();

    await expect(card.getByTestId("rb-fitsum")).toContainText("24.0 t/mo");
    await expect.poll(() => mock.marks.get("N1-alpha")?.monthlyTonnes, { timeout: 5000 }).toBe(60);
    await expect.poll(() => mock.marks.get("N1-alpha")?.polymers).toBe("PP");
  });

  test("a sample ticks the stop, then its trial result closes it out", async ({ page }) => {
    const mock = await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await page.getByTestId("rb-leg").first().locator(".rb-leg-toggle").click();
    const card = page.getByTestId("rb-stop").first();

    await card.getByTestId("rb-sample-btn").click();
    await card.getByTestId("rb-sample-grade").fill("LIMEX PP-50");
    await card.getByTestId("rb-sample-kg").fill("8");
    await card.getByTestId("rb-sample-add").click();

    await expect(card.getByTestId("rb-samplerow")).toContainText("8 kg · LIMEX PP-50");
    await expect(card).toHaveClass(/is-ticked/); // handing a sample over IS the visit
    await expect.poll(() => mock.samples.length, { timeout: 5000 }).toBe(1);

    await card.getByTestId("rb-sample-result").click();
    await card.locator(".rb-sampleresult input").fill("Ran 40% clean");
    await card.getByTestId("rb-res-PASS").click();
    await expect(card.getByTestId("rb-samplerow")).toContainText("Passed");
    await expect.poll(() => mock.samples[0]?.result, { timeout: 5000 }).toBe("PASS");
  });

  test("the rate box drives every rupee figure and persists", async ({ page }) => {
    const mock = await mockPortal(page);
    await page.goto("/#/admin/route-book");
    await expect(page.getByTestId("rb-ratebox")).toBeVisible();
    await page.getByTestId("rb-rate").fill("100");
    await page.getByTestId("rb-pct").fill("50");
    await page.getByTestId("rb-rate-save").click();
    await expect.poll(() => mock.getSettings().limexRate, { timeout: 5000 }).toBe(100);
    await expect.poll(() => mock.getSettings().substitutionPct).toBe(50);
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

test('visit import requires a date and preserves existing notes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wd_admin_token', 'mock-jwt'));
  const { marks } = await mockPortal(page);
  marks.set('N1-alpha', { stopId: 'N1-alpha', note: 'Earlier visit', starred: false });
  let imported: { marks: Record<string, unknown>[]; events: Record<string, unknown>[] } | undefined;
  await page.route('**/api/portal/route-book/import', async r => {
    imported = r.request().postDataJSON();
    await r.fulfill(ok({ marks: 1, events: 3, skippedStops: [] }));
  });
  await page.goto('/#/admin/route-book');
  await page.getByTestId('rb-tab-plan').click();
  await page.getByRole('button', { name: 'Import records', exact: true }).click();
  await page.getByLabel('Visit file (.json)').setInputFiles({
    name: 'visits.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ records: [{ stopId: 'N1-alpha', name: 'Alpha Polymers', time: '13:40', ticked: true, starred: true, note: 'Follow up next week' }] })),
  });
  await expect(page.getByRole('button', { name: 'Import 1 visits' })).toBeDisabled();
  await page.getByLabel('Actual visit date').fill('2026-09-03');
  await page.getByRole('button', { name: 'Import 1 visits' }).click();
  await expect(page.getByRole('dialog', { name: 'Import visit records' })).toHaveCount(0);
  expect(imported?.marks[0].note).toBe('Earlier visit\n\nFollow up next week');
  expect(imported?.events).toHaveLength(3);
  expect(imported?.events[0].at).toBe('2026-09-03T13:40:00+05:30');
});

test('deleting a day row leaves its company in the register', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wd_admin_token', 'mock-jwt'));
  const { events } = await mockPortal(page);
  events.push({ id: 'visit-1', kind: 'tick', value: '1', day: '2026-09-03', at: '2026-09-03T08:10:00Z', stopId: 'N1-alpha', stop: { name: 'Alpha Polymers', legId: 'N1' }, user: me });
  let deleted = false;
  await page.route('**/api/portal/route-book/days/2026-09-03/stops/N1-alpha', async r => {
    expect(r.request().method()).toBe('DELETE');
    deleted = true; events.splice(0);
    await r.fulfill(ok({ deleted: 1 }));
  });
  await page.goto('/#/admin/route-book');
  await page.getByTestId('rb-tab-plan').click();
  page.once('dialog', d => d.accept());
  await page.getByRole('button', { name: 'Delete day record for Alpha Polymers', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delete day record for Alpha Polymers', exact: true })).toHaveCount(0);
  expect(deleted).toBe(true);
  await page.getByTestId('rb-tab-all').click();
  await expect(page.locator("[data-testid='rb-stop'][data-id='N1-alpha']")).toBeVisible();
});

test('clean desk filters real tasks, hides removed companies, and links to the company', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wd_admin_token', 'mock-jwt'));
  const { marks } = await mockPortal(page);
  marks.set('N1-alpha', { stopId: 'N1-alpha', dueOn: '2020-01-01', nextStep: 'Discuss the trial result' });
  marks.set('N1-beta', { stopId: 'N1-beta', dueOn: '2020-01-01', removed: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/admin/dashboard');
  await expect(page.getByTestId('book-desk')).toBeVisible();
  await expect(page.locator('.bd-row')).toHaveCount(1);
  await expect(page.locator('.bd-row')).toContainText('Alpha Polymers');
  await page.getByLabel('Search daily tasks').fill('missing');
  await expect(page.locator('.bd-empty')).toContainText('No companies match');
  await page.getByLabel('Search daily tasks').fill('');
  await page.getByRole('button', { name: 'Payment check' }).click();
  await expect(page.locator('.bd-empty')).toContainText('No payment check');
  await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  // The workspace nav is the four books plus Today — named, not just counted,
  // so adding a fifth link cannot quietly pass while the wrong one is listed.
  await expect(page.locator('.adm-drawer .wd-nav a')).toHaveText([
    'Today', 'LIMEX Route Book', 'LIMEX Visit Follow-ups', 'LIMEX Lead Book', 'LIMEX Customer Book',
  ]);
  await expect(page.locator('.adm-drawer .wd-nav')).not.toContainText('AI Brain');
  await page.getByRole('button', { name: 'Close menu', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Follow-ups due' }).click();
  await page.screenshot({ path: '/tmp/clean-book-desk-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Open company' }).click();
  await expect(page.getByTestId('rb-page')).toBeVisible();
});

test('the desk snoozes a follow-up, offers WhatsApp, and keeps its queue in the URL', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wd_admin_token', 'mock-jwt'));
  const mock = await mockPortal(page);
  mock.marks.set('N1-alpha', { stopId: 'N1-alpha', dueOn: '2020-01-01', nextStep: 'Discuss the trial result', contactPhone: '9876543210' });

  // This test navigates twice. `load` also waits on the Google Fonts and
  // analytics requests in the head, which the page does not need to be
  // usable — two of those waits do not fit the budget. Same reason, and the
  // same fix, as admin.spec.ts.
  await page.goto('/#/admin/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('book-desk')).toBeVisible();

  // The overdue date is spoken, not printed as a bare ISO string.
  await expect(page.locator('.bd-row').first()).toContainText('Overdue by');
  await expect(page.getByRole('link', { name: 'WhatsApp Alpha Polymers' }))
    .toHaveAttribute('href', /wa\.me\/919876543210/);

  // The book works in the rep's own day, not UTC — so does this expectation.
  const d = new Date(Date.now() + 7 * 86_400_000);
  const inAWeek = new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  await page.getByRole('button', { name: 'Follow up with Alpha Polymers next week' }).click();
  await expect.poll(() => mock.marks.get('N1-alpha')?.dueOn, { timeout: 5000 }).toBe(inAWeek);

  // The chosen queue survives a reload.
  await page.getByRole('button', { name: 'No next step' }).click();
  await expect(page).toHaveURL(/q=nostep/);
  // `load` also waits on the Google Fonts and analytics requests in the head,
  // which the page does not need to be usable. Same reason as admin.spec.ts.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('book-desk')).toBeVisible();
  await expect(page.getByRole('button', { name: /^No next step/ })).toHaveAttribute('aria-pressed', 'true');
});

test('the record still loads after Refresh, and asks for each day once', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('wd_admin_token', 'mock-jwt'));
  const { events } = await mockPortal(page);
  const days = ['2026-09-02', '2026-09-05', '2026-09-07'];
  for (const [i, day] of days.entries()) {
    events.push({ id: `e${i}`, kind: 'tick', value: '1', day, at: `${day}T08:1${i}:00Z`,
      stopId: 'N1-alpha', stop: { name: 'Alpha Polymers', legId: 'N1' }, user: me });
  }
  await page.route('**/api/portal/route-book/days', r =>
    r.fulfill(ok(Object.fromEntries(days.map(d => [d, { tick: 1 }])))));

  const asked: string[] = [];
  await page.route('**/api/portal/route-book/events**', async r => {
    const day = new URL(r.request().url()).searchParams.get('day');
    if (day) asked.push(day);
    await r.fulfill(ok(events.filter(e => e.day === day)));
  });

  await page.goto('/#/admin/route-book');
  await page.getByTestId('rb-tab-plan').click();
  for (const d of days) await expect(page.locator(`.rb-dsec[data-day="${d}"]`)).toContainText('Alpha Polymers');
  await expect(page.getByText('Loading…')).toHaveCount(0);
  // one request per open day, not one per day per resolution
  expect(asked.length).toBe(days.length);

  await page.getByRole('button', { name: 'Refresh record' }).click();
  for (const d of days) await expect(page.locator(`.rb-dsec[data-day="${d}"]`)).toContainText('Alpha Polymers');
  await expect(page.getByText('Loading…')).toHaveCount(0);
  expect(asked.length).toBe(days.length * 2);
});
