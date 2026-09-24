#!/usr/bin/env node
/**
 * Apply the email DNS fix described in docs/EMAIL_DNS.md to the Cloudflare
 * zone that is authoritative for the domain.
 *
 * It removes the "this domain sends no mail" lockdown records that collide
 * with the real mailbox provider's records — the collision that makes SPF
 * return PermError and mail clients demand you "set your SPF records
 * correctly" — and leaves exactly one SPF and one DMARC record behind.
 *
 * The mailbox provider is GoDaddy (`secureserver.net`), matching the live MX.
 * Zoho was configured on this domain at some point and is being removed
 * entirely, so every Zoho-referencing record in the zone is purged too.
 *
 * Usage:
 *   export CLOUDFLARE_API_TOKEN=...          # Zone.DNS:Edit on this zone
 *   node scripts/fix-email-dns.mjs           # dry run, prints plan
 *   node scripts/fix-email-dns.mjs --apply   # execute
 *
 * Options:
 *   --domain=example.com   Default: whitedotindia.in
 *   --apply                Actually write. Without it, nothing is changed.
 *
 * MX records are never modified. Changing them cuts over live mail delivery —
 * do that deliberately in the Cloudflare UI.
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const domain = flag("domain", "whitedotindia.in");
const apply = args.includes("--apply");
const token = process.env.CLOUDFLARE_API_TOKEN;

/** GoDaddy / secureserver.net is the mailbox provider, matching the live MX. */
const SPF = "v=spf1 include:secureserver.net -all";

const DMARC =
  `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}; adkim=r; aspf=r;`;
if (!token) {
  console.error(
    "CLOUDFLARE_API_TOKEN is not set.\n\n" +
      "Create one at dash.cloudflare.com → My Profile → API Tokens →\n" +
      "Create Token → Edit zone DNS, scoped to this zone only. Then:\n\n" +
      "  export CLOUDFLARE_API_TOKEN=...\n" +
      "  node scripts/fix-email-dns.mjs --apply\n\n" +
      "The token is a secret: never commit it or paste it into a file in " +
      "this repo.",
  );
  process.exit(2);
}

const API = "https://api.cloudflare.com/client/v4";

async function cf(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    const detail = (json.errors || [])
      .map((e) => `${e.code}: ${e.message}`)
      .join("; ");
    throw new Error(`Cloudflare ${res.status} on ${path} — ${detail || "unknown error"}`);
  }
  return json.result;
}

/** SPF/DMARC/DKIM semantics live in the TXT content, so normalise it once. */
const isSpf = (r) => /^"?v=spf1\b/i.test(r.content);
const isNullDkim = (r) => /v=DKIM1/i.test(r.content) && /\bp=\s*"?\s*$/.test(r.content);

async function main() {
  console.log(
    `\nEmail DNS fix — ${domain} (provider: GoDaddy / secureserver.net)` +
      `${apply ? "" : "   [DRY RUN — nothing will be changed]"}\n` +
      "=".repeat(64) + "\n",
  );

  const zones = await cf(`/zones?name=${encodeURIComponent(domain)}`);
  if (zones.length === 0) {
    throw new Error(
      `No Cloudflare zone named ${domain} is visible to this token. ` +
        `Check the token's zone scope.`,
    );
  }
  const zone = zones[0];
  console.log(`Zone: ${zone.name} (${zone.id})\n`);

  const all = await cf(`/zones/${zone.id}/dns_records?per_page=500`);
  const txt = all.filter((r) => r.type === "TXT");

  const deletes = [];
  const creates = [];
  const updates = [];
  const warnings = [];

  // --- SPF: collapse to exactly one record ---------------------------------
  const spf = txt.filter((r) => r.name === domain && isSpf(r));
  const wanted = SPF;
  const keeper = spf.find((r) => r.content.replace(/^"|"$/g, "") === wanted);

  if (keeper) {
    for (const r of spf) {
      if (r.id !== keeper.id) {
        deletes.push([r, "duplicate SPF record — RFC 7208 allows exactly one"]);
      }
    }
  } else if (spf.length > 0) {
    // Repurpose the first, delete the rest, so the domain is never SPF-less.
    updates.push([spf[0], wanted, "rewrite to the GoDaddy SPF record"]);
    for (const r of spf.slice(1)) {
      deletes.push([r, "duplicate SPF record — RFC 7208 allows exactly one"]);
    }
  } else {
    creates.push([{ type: "TXT", name: domain, content: wanted }, "no SPF record exists"]);
  }

  // --- DMARC: collapse to exactly one record -------------------------------
  const dmarcName = `_dmarc.${domain}`;
  const dmarc = txt.filter(
    (r) => r.name === dmarcName && /v=DMARC1/i.test(r.content),
  );
  if (dmarc.length === 0) {
    creates.push([{ type: "TXT", name: dmarcName, content: DMARC }, "no DMARC record exists"]);
  } else {
    // Prefer whichever is not the strict p=reject lockdown record.
    const strictLockdown = (r) =>
      /p=reject/i.test(r.content) && /a(spf|dkim)=s\b/i.test(r.content);
    const survivor = dmarc.find((r) => !strictLockdown(r)) || dmarc[0];
    if (strictLockdown(survivor)) {
      updates.push([survivor, DMARC, "replace the p=reject lockdown policy"]);
    }
    for (const r of dmarc) {
      if (r.id !== survivor.id) {
        deletes.push([r, "duplicate DMARC record — RFC 7489 ignores DMARC entirely when there is more than one"]);
      }
    }
  }

  // --- DKIM: remove revoked (empty p=) keys, wildcard first ----------------
  for (const r of txt) {
    if (!r.name.includes("_domainkey") || !isNullDkim(r)) continue;
    const why = r.name.startsWith("*.")
      ? "wildcard null DKIM key — revokes every selector on the domain, so DKIM can never pass"
      : "revoked DKIM key (empty p=)";
    deletes.push([r, why]);
  }

  // --- Zoho: remove every trace ------------------------------------------
  // Zoho is being decommissioned on this domain. Sweep the whole zone rather
  // than a guessed list of names, so nothing is left behind to confuse a
  // future setup: verification TXT records, zb* CNAMEs, mx*.zoho MX records,
  // an SPF include, and the zoho._domainkey selector.
  const mentionsZoho = (r) =>
    /(^|[.\-_])zoho([.\-_]|$)/i.test(r.name) || /zoho/i.test(r.content || "");

  const alreadyQueued = new Set([
    ...deletes.map(([r]) => r.id),
    ...updates.map(([r]) => r.id),
  ]);

  for (const r of all) {
    if (!mentionsZoho(r) || alreadyQueued.has(r.id)) continue;
    if (r.type === "MX") {
      // Deleting an MX record changes where mail is delivered. The live MX is
      // GoDaddy's, so a Zoho MX here would be a leftover — but flag it for a
      // human rather than silently rerouting mail.
      warnings.push(
        `Zoho MX record found and NOT deleted: ${r.name} → ${r.content}. ` +
          `Remove it by hand in Cloudflare once you have confirmed mail is ` +
          `flowing through GoDaddy.`,
      );
      continue;
    }
    deletes.push([r, "Zoho leftover — Zoho is being removed from this domain"]);
  }

  for (const w of warnings) console.log(`  WARN  ${w}\n`);

  if (deletes.length + creates.length + updates.length === 0) {
    console.log("Nothing to change — the zone already matches the target state.\n");
    return;
  }

  console.log("Plan:\n");
  for (const [r, why] of deletes) {
    console.log(`  DELETE  ${r.name}  ${r.type}`);
    console.log(`          ${r.content}`);
    console.log(`          reason: ${why}\n`);
  }
  for (const [r, content, why] of updates) {
    console.log(`  UPDATE  ${r.name}  ${r.type}`);
    console.log(`          from: ${r.content}`);
    console.log(`          to:   ${content}`);
    console.log(`          reason: ${why}\n`);
  }
  for (const [r, why] of creates) {
    console.log(`  CREATE  ${r.name}  ${r.type}`);
    console.log(`          ${r.content}`);
    console.log(`          reason: ${why}\n`);
  }

  if (!apply) {
    console.log("=".repeat(64));
    console.log("Dry run. Re-run with --apply to execute.\n");
    return;
  }

  for (const [r] of deletes) {
    await cf(`/zones/${zone.id}/dns_records/${r.id}`, { method: "DELETE" });
    console.log(`  deleted  ${r.name}`);
  }
  for (const [r, content] of updates) {
    await cf(`/zones/${zone.id}/dns_records/${r.id}`, {
      method: "PATCH",
      body: JSON.stringify({ content }),
    });
    console.log(`  updated  ${r.name}`);
  }
  for (const [rec] of creates) {
    await cf(`/zones/${zone.id}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ ...rec, ttl: 1 }),
    });
    console.log(`  created  ${rec.name}`);
  }

  console.log(`\n${"=".repeat(64)}`);
  console.log(
    "Applied. Wait a few minutes for propagation, then run:\n\n" +
      "  npm run check:email-dns\n\n" +
      "DKIM is still outstanding: enable it in the mailbox provider's admin " +
      "panel and add the selector record it gives you. With the wildcard " +
      "removed, that key will now be honoured. See docs/EMAIL_DNS.md §4.\n",
  );
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}\n`);
  process.exitCode = 1;
});
