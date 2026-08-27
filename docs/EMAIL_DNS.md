# Email DNS — SPF, DKIM, DMARC for `whitedotindia.in`

> **Status: BROKEN.** Mail clients show *"Action Required: To send and receive
> emails, you need to set your domain's SPF records correctly."* This document
> explains exactly why, and the exact records that fix it.
>
> Verify at any time with `npm run check:email-dns`.

---

## 1. Where to make these changes

DNS for `whitedotindia.in` is authoritative on **Cloudflare**:

```
noel.ns.cloudflare.com
fiona.ns.cloudflare.com
```

So every record below is edited at **dash.cloudflare.com → whitedotindia.in →
DNS → Records**. Not at Hostinger, not at the registrar's own DNS panel.
Changes there will have no effect while Cloudflare is authoritative.

> Records for the **website** (`A` → Cloudflare proxy, `api.` → the VPS) are
> unaffected by anything in this document. Mail records and web records are
> independent. See `DEPLOYMENT.md` for the web side.

---

## 2. Why it is broken

Two contradictory configurations are published at the same time.

**Configuration A — a "this domain sends no mail" lockdown.** This is the
standard hardening triple applied to parked domains, most likely from a
one-click security tool:

| Name | Type | Value |
| --- | --- | --- |
| `whitedotindia.in` | TXT | `v=spf1 -all` |
| `_dmarc` | TXT | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;` |
| `*._domainkey` | TXT | `v=DKIM1; p=` |

**Configuration B — a real mailbox provider** (GoDaddy / `secureserver.net`,
which is what the live MX records point to):

| Name | Type | Value |
| --- | --- | --- |
| `whitedotindia.in` | MX | `0 smtp.secureserver.net` |
| `whitedotindia.in` | MX | `10 mailstore1.secureserver.net` |
| `whitedotindia.in` | TXT | `v=spf1 include:secureserver.net -all` |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` |

Publishing both produces three independent, blocking failures:

1. **Two SPF records.** RFC 7208 §4.5 allows exactly one. When a receiver
   finds two, it does not pick one or merge them — it returns **PermError**
   and treats SPF as unusable. This is the failure the client banner is
   reporting. It is not a typo in either record; it is their coexistence.

2. **Two DMARC records.** RFC 7489 §6.6.3 says that if the lookup yields
   more than one record, DMARC **is not applied at all**. All the policy,
   alignment and reporting configuration is silently discarded.

3. **A wildcard null DKIM key.** `*._domainkey` answers for *every* selector.
   `p=` with an empty value is the RFC 6376 signal for a **revoked key** —
   receivers are instructed to distrust anything signed with it. Because it is
   a wildcard, this applies to selectors that do not otherwise exist. Adding
   the provider's real DKIM key as, say, `default._domainkey` fixes nothing
   while the wildcard stands, because an explicit record only shadows the
   wildcard for that one name.

Net effect: SPF permanently errors, DKIM can never pass, and DMARC is ignored.
Mail is rejected or spam-foldered, and the provider refuses to activate the
domain until SPF resolves cleanly.

---

## 3. The fix

There are two paths. They produce the same result — pick one.

### Path A — one command (recommended)

Create a Cloudflare API token at **dash.cloudflare.com → My Profile → API
Tokens → Create Token → Edit zone DNS**, scoped to the `whitedotindia.in`
zone only. Then:

```bash
export CLOUDFLARE_API_TOKEN=...        # never commit this
npm run fix:email-dns                  # dry run — prints the plan, changes nothing
npm run fix:email-dns -- --apply       # execute
```

The script collapses SPF to exactly one record, collapses DMARC to exactly
one record with a `p=quarantine` policy, and deletes every revoked DKIM key
including the wildcard. It never touches MX records, the
`google-site-verification` record, or anything web-related. Add
`--provider=zoho` if the mailbox is Zoho rather than GoDaddy.

DKIM still needs one manual step afterwards — see Step 3 below — because only
your mailbox provider can issue the key.

### Path B — by hand in the Cloudflare dashboard


#### Step 1 — Decide who hosts the mailbox

The live MX records point to **GoDaddy (`secureserver.net`)**. Note that the
domain also carries a `zoho._domainkey` name, suggesting Zoho Mail was set up
at some point. **Only one provider can hold the MX records.** Confirm which
mailbox you actually log in to, then follow the GoDaddy or the Zoho table below.
Do not publish both sets.

#### Step 2 — Delete the lockdown records

Do this first, regardless of provider. In Cloudflare DNS, **delete**:

- the TXT record on the root whose value is exactly `v=spf1 -all`
- the TXT record on `_dmarc` whose value is `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s;`
- the TXT record on `*._domainkey` whose value is `v=DKIM1; p=`

Leave the `google-site-verification=...` TXT record alone — it is unrelated to
mail and Search Console depends on it.

#### Step 3 — Publish one correct set

##### If the mailbox is GoDaddy / `secureserver.net`

This matches the current MX records, so only the TXT side needs work. After
Step 2 you already have the right SPF and DMARC records; verify that these,
and only these, remain:

| Name | Type | Value | TTL |
| --- | --- | --- | --- |
| `@` | TXT | `v=spf1 include:secureserver.net -all` | Auto |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; rua=mailto:dmarc@whitedotindia.in; adkim=r; aspf=r;` | Auto |

Then enable DKIM in the GoDaddy / Microsoft 365 admin panel and add the CNAME
or TXT selector records it gives you. With the wildcard gone, they will work.

##### If the mailbox is Zoho Mail

Replace the MX records as well. Zoho's own control panel is authoritative for
these values — copy them from **Zoho Mail Admin → Domains → DNS Mapping**
rather than from here, since Zoho assigns a per-domain DKIM key and regional
MX hosts. The shape is:

| Name | Type | Value | Priority |
| --- | --- | --- | --- |
| `@` | MX | `mx.zoho.in` | 10 |
| `@` | MX | `mx2.zoho.in` | 20 |
| `@` | MX | `mx3.zoho.in` | 50 |
| `@` | TXT | `v=spf1 include:zohomail.in -all` | — |
| `zoho._domainkey` | TXT | *(the long `v=DKIM1; k=rsa; p=MIGf...` key from Zoho)* | — |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; rua=mailto:dmarc@whitedotindia.in; adkim=r; aspf=r;` | — |

Use `zoho.com` hosts (`mx.zoho.com`, `include:zoho.com`) if the account is on
the US datacentre rather than the Indian one — the Zoho panel states which.

The existing `zoho._domainkey` record with `p=` must be **overwritten with the
real key**, not left in place.

> **Do not proxy mail records.** In Cloudflare, MX records have no proxy
> toggle, but any `mail.` or `smtp.` A/CNAME record must be set to **DNS only**
> (grey cloud). Proxying breaks SMTP.

## 4. DKIM, and mail sent by the app itself

This applies to both paths above.

The backend sends password-reset mail through SMTP (`server/src/services/
mailer.service.ts`, configured by `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` /
`SMTP_FROM`). Two rules:

- Set `SMTP_FROM` to an address **on a domain whose SPF authorises the sending
  server**. Sending as `no-reply@whitedotindia.in` through a relay that
  `include:secureserver.net` does not cover will fail SPF and, once DMARC
  applies again, be rejected.
- If you move to an API sender instead (the `RESEND_API_KEY` slot in
  `.env.example` is a leftover from an earlier plan and is not read by any
  code), you must add that provider's `include:` to the single SPF record and
  its DKIM selector — and stay under the 10-lookup SPF limit.

Leaving SMTP unset is safe: the mailer logs the message instead of sending.

---

## 5. Verify

```bash
npm run check:email-dns
```

Checks MX presence, exactly-one valid SPF within the 10-lookup limit, exactly
one DMARC record, and DKIM selectors including the wildcard trap. Exit code 1
means at least one blocking problem remains.

Other domains and selectors:

```bash
node scripts/check-email-dns.mjs example.com --selectors=default,s1
```

Allow up to an hour for propagation before trusting a re-check, then press
**CHECK AGAIN** in the mail client. Once SPF resolves to a single record the
banner clears.

---

## 6. Order of operations, and why

Tighten the policy *after* authentication demonstrably passes, never before:

1. Delete the lockdown records — this alone clears the SPF PermError.
2. Publish one SPF and the provider's real DKIM key.
3. Send a test message to a Gmail address. Open **Show original** and confirm
   `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
4. Only then consider moving DMARC from `p=quarantine` to `p=reject`.

Going straight to `p=reject` with strict alignment — which is what the
lockdown record did — is precisely how a domain ends up unable to send mail.
