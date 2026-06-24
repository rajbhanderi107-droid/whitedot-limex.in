import type { Request } from "express";
import type { SecurityEventKind, PortalRiskLevel } from "@prisma/client";
/**
 * Record a security event. Fire-and-forget: telemetry must never break or
 * slow down the request path, so all failures are swallowed.
 *
 * IPs are truncated (IPv4 → /24, IPv6 → first 3 hextets) — enough to spot
 * an attack pattern without storing a full personal identifier.
 */
export declare function recordSecurityEvent(opts: {
    kind: SecurityEventKind;
    req: Request;
    detail?: string;
    severity?: PortalRiskLevel;
}): void;
//# sourceMappingURL=securityEvents.service.d.ts.map