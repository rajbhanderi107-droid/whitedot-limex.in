/* Security control inventory — reflects controls that ACTUALLY exist in the
 * WhiteDot backend today (verified against server/src), versus those still
 * planned. We do not claim controls that aren't implemented. Runtime
 * detection (threat feed, malware/vuln scanning) is honestly marked planned
 * until instrumented. */

export type ControlStatus = "on" | "partial" | "planned";

export interface Control { name: string; status: ControlStatus; note: string }
export interface ControlCategory { title: string; controls: Control[] }

export const CONTROL_CATEGORIES: ControlCategory[] = [
  {
    title: "Identity & Access",
    controls: [
      { name: "JWT authentication", status: "on", note: "Bearer tokens, server-verified on every admin route." },
      { name: "Bcrypt password hashing", status: "on", note: "bcrypt with per-user salt." },
      { name: "Role-based access control", status: "on", note: "requireRole guards on sensitive routes." },
      { name: "Rate limiting", status: "on", note: "Separate auth / admin / public / chat limiters." },
      { name: "Session & device revocation", status: "partial", note: "Token-based; explicit device list & revoke planned." },
      { name: "MFA / passkeys (WebAuthn)", status: "planned", note: "Schema-ready; enrolment UI planned." },
      { name: "Just-in-time admin elevation", status: "planned", note: "Re-auth for high-risk actions planned." },
    ],
  },
  {
    title: "Application Security",
    controls: [
      { name: "Security headers (Helmet)", status: "on", note: "CSP, X-Frame-Options, Referrer-Policy." },
      { name: "HSTS (preload)", status: "on", note: "max-age 1y, includeSubDomains, preload." },
      { name: "CORS origin allowlist", status: "on", note: "Explicit allowlist; unknown origins blocked." },
      { name: "Input validation (Zod)", status: "on", note: "Schema validation on admin write routes." },
      { name: "Parameterized queries (Prisma)", status: "on", note: "No raw string-concatenated SQL." },
      { name: "CSRF posture", status: "partial", note: "Bearer-token auth avoids cookie CSRF; review pending." },
      { name: "Webhook signature validation", status: "planned", note: "Lands with the Integration Center." },
    ],
  },
  {
    title: "Data Protection",
    controls: [
      { name: "TLS in transit (HTTPS)", status: "on", note: "Enforced on the live domain + backend." },
      { name: "Secrets in env (not in client)", status: "on", note: "No secrets in the client bundle." },
      { name: "Audit logging", status: "on", note: "Important actions written to the activity log." },
      { name: "Encryption at rest", status: "partial", note: "Provider-managed; verify on the DB host." },
      { name: "Backups & restore tests", status: "planned", note: "Backup & DR module (later phase)." },
    ],
  },
  {
    title: "Detection & Response",
    controls: [
      { name: "Emergency stop / lockdown", status: "on", note: "Portal-wide kill switch (this build)." },
      { name: "Brute-force throttling", status: "partial", note: "Rate limits block; alerting planned." },
      { name: "Incident response workflow", status: "partial", note: "Lifecycle UI shipped; automation planned." },
      { name: "Threat detection feed", status: "planned", note: "SQLi/XSS/SSRF/IDOR signals planned." },
      { name: "Malware & dependency scanning", status: "planned", note: "DevSecOps pipeline (later phase)." },
      { name: "Vulnerability scanning", status: "planned", note: "SAST/DAST (later phase)." },
    ],
  },
  {
    title: "Reliability",
    controls: [
      { name: "Uptime monitoring", status: "planned", note: "Website Health module (later phase)." },
      { name: "Error monitoring", status: "planned", note: "Error tracker integration planned." },
      { name: "Health checks", status: "planned", note: "Endpoint + integration health planned." },
    ],
  },
];

const WEIGHT: Record<ControlStatus, number> = { on: 1, partial: 0.5, planned: 0 };

/** Control-coverage score (0–100). Honest: it measures implemented controls,
 *  not real-time safety. Degrades while in lockdown. */
export function coverageScore(lockdown: boolean): number {
  const all = CONTROL_CATEGORIES.flatMap((c) => c.controls);
  const raw = all.reduce((s, c) => s + WEIGHT[c.status], 0) / all.length;
  const base = Math.round(raw * 100);
  return lockdown ? Math.max(35, base - 45) : base;
}

export const RESPONSE_ACTIONS = [
  "Block request", "Rate-limit IP/user", "Revoke session", "Require re-authentication",
  "Disable suspicious integration", "Pause automation", "Quarantine file", "Create incident",
  "Notify Security Admin", "Enable Lockdown Mode",
];
