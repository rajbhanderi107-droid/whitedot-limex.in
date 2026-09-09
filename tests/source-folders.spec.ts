import { test, expect } from "@playwright/test";
import { sourceFolderOf, validFolder } from "../src/admin/routebook/sources.js";
import { buildCSV } from "../src/admin/routebook/logic.js";
import { leadBookSheet, followUpBookSheet, customerBookSheets, customerBookBlocks } from "../src/admin/routebook/exports.js";
import type { RbStop, RbMark } from "../src/admin/routebook/types.js";
const stop = { id: "gpt", name: "Example", legId: "R5", fit: "good", tags: [{ t: "GPT Leads", c: "green" }], userAdded: false } as RbStop;
test("research attribution survives every stage and explicit corrections win", () => {
  for (const stage of ["PROSPECT", "LEAD", "CUSTOMER", "LOST"] as const) {
    expect(sourceFolderOf(stop, { stage, ticked: true } as RbMark)).toBe("GPT");
    expect(sourceFolderOf(stop, { stage, sourceFolder: "CLAUDE" } as RbMark)).toBe("CLAUDE");
  }
  expect(sourceFolderOf({ ...stop, tags: [] })).toBe("CLAUDE");
  expect(sourceFolderOf({ ...stop, tags: [], userAdded: true })).toBe("TEAM");
  expect(validFolder("constructor")).toBe("ALL");
  expect(validFolder("GPT")).toBe("GPT");
});
test("all four book exports retain the source folder", () => {
  const rows = [{ s: stop }];
  expect(buildCSV(rows, {})).toContain('GPT Leads');
  for (const sheet of [leadBookSheet(rows, {}), followUpBookSheet(rows, {}), customerBookSheets(rows, {}, null)[0]]) {
    const idx = sheet.rows[0].indexOf("Source folder");
    expect(idx).toBeGreaterThan(-1);
    expect(sheet.rows[1][idx]).toBe("GPT Leads");
    expect(sheet.rows[0].length).toBe(sheet.rows[1].length);
  }
  expect(JSON.stringify(customerBookBlocks(rows, {}))).toContain("GPT Leads");
});
