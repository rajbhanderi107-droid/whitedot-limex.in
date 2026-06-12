import type { Request } from "express";
import type { SecurityEventKind, PortalRiskLevel } from "@prisma/client";
import { prisma } from "../config/prisma.js";

/**
 * Record a security event. Fire-and-forget: telemetry must never break or
 * slow down the request path, so all failures are swallowed.
 *
 * IPs are truncated (IPv4 → /24, IPv6 → first 3 hextets) — enough to spot
 * an attack pattern without storing a full personal identifier.
 */
export function recordSecurityEvent(opts: {
  kind: SecurityEventKind;
  req: Request;
  detail?: string;
  severity?: PortalRiskLevel;
}): void {
  const { kind, req, detail, severity = "LOW" } = opts;
  void prisma.securityEvent
    .create({
      data: {
        kind,
        severity,
        path: (req.baseUrl + req.path).slice(0, 200),
        method: req.method,
        ip: truncateIp(req.ip),
        detail: detail?.slice(0, 500),
      },
    })
    .catch(() => {});
}

function truncateIp(ip: string | undefined): string | null {
  if (!ip) return null;
  if (ip.includes(".")) {
    const parts = ip.replace(/^::ffff:/, "").split(".");
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.x` : ip.slice(0, 45);
  }
  return ip.split(":").slice(0, 3).join(":") + "::x";
}
