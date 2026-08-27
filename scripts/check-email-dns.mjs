#!/usr/bin/env node
/**
 * Email DNS health check for whitedotindia.in (or any domain).
 *
 * Verifies the records that mail providers require before they will let a
 * domain send or receive mail: MX, a single valid SPF record, a single valid
 * DMARC record, and non-revoked DKIM selectors.
 *
 * Usage:
 *   node scripts/check-email-dns.mjs [domain] [--selectors=zoho,resend]
 *
 * Uses DNS-over-HTTPS (Cloudflare) so it works anywhere with outbound HTTPS,
 * with no `dig` / `nslookup` dependency.
 */

const args = process.argv.slice(2);
const domain = args.find((a) => !a.startsWith("--")) || "whitedotindia.in";
const selectorArg = args.find((a) => a.startsWith("--selectors="));
const selectors = selectorArg
  ? selectorArg.split("=")[1].split(",").filter(Boolean)
  : ["zoho", "resend", "default", "google", "s1", "s2"];

const DOH = "https://cloudflare-dns.com/dns-query";

async function resolve(name, type) {
  const url = `${DOH}?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DoH ${res.status} for ${type} ${name}`);
  const json = await res.json();
  return (json.Answer || [])
    .filter((a) => a.type !== 5) // drop CNAME hops
    .map((a) => a.data);
}

/** TXT answers arrive quoted and may be split into 255-char chunks. */
function unquoteTxt(raw) {
  const parts = raw.match(/"((?:[^"\\]|\\.)*)"/g);
  if (!parts) return raw.trim();
  return parts.map((p) => p.slice(1, -1).replace(/\\"/g, '"')).join("");
}

const problems = [];
const warnings = [];
const ok = [];

function fail(msg, fix) {
  problems.push({ msg, fix });
}

async function checkMx() {
  const mx = await resolve(domain, "MX");
  if (mx.length === 0) {
    fail(
      `No MX record on ${domain} — the domain cannot receive mail.`,
      "Add the MX records your mailbox provider gives you.",
    );
    return null;
  }
  const hosts = mx.map((r) => r.split(/\s+/).pop().replace(/\.$/, ""));
  ok.push(`MX (${hosts.length}): ${hosts.join(", ")}`);
  return hosts;
}

async function checkSpf() {
  const txt = (await resolve(domain, "TXT")).map(unquoteTxt);
  const spf = txt.filter((t) => /^v=spf1\b/i.test(t));

  if (spf.length === 0) {
    fail(
      `No SPF record on ${domain}.`,
      "Publish exactly one TXT record at the root starting with v=spf1.",
    );
    return;
  }
  if (spf.length > 1) {
    fail(
      `${spf.length} SPF records on ${domain} — RFC 7208 allows exactly one. ` +
        `Receivers return PermError and treat SPF as broken:\n` +
        spf.map((s) => `      • ${s}`).join("\n"),
      "Delete every SPF TXT record but one, merging the include: mechanisms into it.",
    );
    return;
  }

  const record = spf[0];
  const mechanisms = record.split(/\s+/).slice(1);
  const hasSource = mechanisms.some((m) =>
    /^[+~?-]?(include:|a$|a:|mx$|mx:|ip4:|ip6:|exists:)/i.test(m),
  );
  if (!hasSource) {
    fail(
      `SPF record "${record}" authorises no senders at all — every message ` +
        `From this domain fails SPF.`,
      "Add the include: your mailbox provider specifies before the -all.",
    );
    return;
  }
  if (!/[~-]all\s*$/i.test(record)) {
    warnings.push(
      `SPF does not end in -all or ~all: "${record}" — spoofing is not blocked.`,
    );
  }
  const lookups = mechanisms.filter((m) =>
    /^[+~?-]?(include:|a$|a:|mx$|mx:|exists:|redirect=)/i.test(m),
  ).length;
  if (lookups > 10) {
    fail(
      `SPF needs ${lookups} DNS lookups; the RFC limit is 10 (PermError above it).`,
      "Flatten or drop include: mechanisms until 10 or fewer remain.",
    );
    return;
  }
  ok.push(`SPF (1 record, ${lookups}/10 lookups): ${record}`);
}

async function checkDmarc() {
  const txt = (await resolve(`_dmarc.${domain}`, "TXT")).map(unquoteTxt);
  const dmarc = txt.filter((t) => /^v=DMARC1\b/i.test(t));

  if (dmarc.length === 0) {
    warnings.push(
      `No DMARC record at _dmarc.${domain}. Not fatal, but Gmail and Yahoo ` +
        `now require one for bulk senders.`,
    );
    return;
  }
  if (dmarc.length > 1) {
    fail(
      `${dmarc.length} DMARC records at _dmarc.${domain} — RFC 7489 requires ` +
        `exactly one, so DMARC is ignored entirely:\n` +
        dmarc.map((d) => `      • ${d}`).join("\n"),
      "Keep one DMARC TXT record and delete the rest.",
    );
    return;
  }

  const record = dmarc[0];
  const policy = (record.match(/\bp=(\w+)/i) || [])[1]?.toLowerCase();
  const strict = /\ba(spf|dkim)=s\b/i.test(record);
  if (policy === "reject" && strict) {
    warnings.push(
      `DMARC is p=reject with strict alignment: "${record}". Nothing sent ` +
        `from a subdomain or a third-party sender will be delivered until ` +
        `SPF and DKIM both pass and align exactly.`,
    );
  }
  ok.push(`DMARC (1 record, p=${policy}): ${record}`);
}

async function checkDkim() {
  // A wildcard *._domainkey record answers for every selector, so probe a
  // random name first — otherwise each selector below reports the same fault.
  const probe = `wd-probe-${Math.random().toString(36).slice(2, 10)}`;
  let wildcard = null;
  try {
    const hit = (await resolve(`${probe}._domainkey.${domain}`, "TXT"))
      .map(unquoteTxt)
      .find((t) => /v=DKIM1/i.test(t));
    if (hit) wildcard = hit;
  } catch {
    /* NXDOMAIN is the healthy answer here */
  }

  if (wildcard !== null) {
    const p = (wildcard.match(/\bp=([A-Za-z0-9+/=]*)/) || [])[1] ?? "";
    if (p === "") {
      fail(
        `A wildcard *._domainkey.${domain} record publishes an empty key ` +
          `("${wildcard}"). An empty p= means REVOKED, and because it is a ` +
          `wildcard it answers for EVERY selector — so no provider can ever ` +
          `pass DKIM on this domain, whatever key they ask you to add.`,
        `Delete the *._domainkey.${domain} TXT record. It is part of a ` +
          `"this domain sends no mail" lockdown and contradicts your MX.`,
      );
    } else {
      warnings.push(
        `A wildcard *._domainkey.${domain} record exists and shadows every ` +
          `selector that is not explicitly published.`,
      );
    }
    return;
  }

  let found = 0;
  for (const selector of selectors) {
    const host = `${selector}._domainkey.${domain}`;
    let txt;
    try {
      txt = (await resolve(host, "TXT")).map(unquoteTxt);
    } catch {
      continue;
    }
    const keys = txt.filter((t) => /v=DKIM1/i.test(t));
    if (keys.length === 0) continue;
    found += 1;

    for (const key of keys) {
      const p = (key.match(/\bp=([A-Za-z0-9+/=]*)/) || [])[1] ?? "";
      if (p === "") {
        fail(
          `DKIM selector "${selector}" publishes an empty key (p=) at ${host}. ` +
            `An empty p= means REVOKED — receivers are told to distrust ` +
            `anything signed with it.`,
          `Replace it with the real public key from your provider, or delete ` +
            `the ${host} record entirely if that provider is no longer used.`,
        );
      } else {
        ok.push(`DKIM "${selector}": key published (${p.length} chars)`);
      }
    }
  }
  if (found === 0) {
    warnings.push(
      `No DKIM key found for selectors: ${selectors.join(", ")}. If your ` +
        `provider uses a different selector, pass --selectors=name.`,
    );
  }
}

async function main() {
  console.log(`\nEmail DNS check — ${domain}\n${"=".repeat(40)}\n`);

  await checkMx();
  await checkSpf();
  await checkDmarc();
  await checkDkim();

  for (const line of ok) console.log(`  OK    ${line}`);
  if (warnings.length) {
    console.log("");
    for (const w of warnings) console.log(`  WARN  ${w}`);
  }
  if (problems.length) {
    console.log("");
    for (const p of problems) {
      console.log(`  FAIL  ${p.msg}`);
      console.log(`        fix: ${p.fix}`);
    }
  }

  console.log(`\n${"=".repeat(40)}`);
  if (problems.length) {
    console.log(
      `${problems.length} blocking problem(s). See docs/EMAIL_DNS.md for the ` +
        `exact records to publish.\n`,
    );
    process.exitCode = 1;
  } else {
    console.log(`No blocking problems. ${warnings.length} warning(s).\n`);
  }
}

main().catch((err) => {
  console.error(`\nCheck failed: ${err.message}\n`);
  process.exitCode = 2;
});
