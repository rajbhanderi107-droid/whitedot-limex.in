import { prisma } from "../config/prisma.js";
import { verifyToken } from "../utils/tokens.js";
import { AppError } from "./error.middleware.js";
import { recordSecurityEvent } from "../services/securityEvents.service.js";
/** Verify JWT from Authorization header and attach currentUser to request */
export async function requireAuth(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;
        const token = bearerToken;
        if (!token)
            throw new AppError(401, "UNAUTHORIZED", "Authentication required");
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, name: true, role: true, isActive: true },
        });
        if (!user || !user.isActive) {
            throw new AppError(401, "UNAUTHORIZED", "Account inactive or not found");
        }
        req.currentUser = { id: user.id, email: user.email, name: user.name, role: user.role };
        next();
    }
    catch (err) {
        // A bad/expired token on a protected route is a security signal; a
        // missing token is usually just an expired session — log it lighter.
        const hadToken = !!req.headers.authorization;
        recordSecurityEvent({
            kind: "AUTH_FAILURE",
            req,
            severity: hadToken ? "MEDIUM" : "LOW",
            detail: hadToken ? "Invalid or expired bearer token" : "No bearer token on protected route",
        });
        if (err instanceof AppError)
            return next(err);
        next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
    }
}
/** Factory: require one of the specified roles */
export function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.currentUser) {
            return next(new AppError(401, "UNAUTHORIZED", "Authentication required"));
        }
        if (!roles.includes(req.currentUser.role)) {
            return next(new AppError(403, "FORBIDDEN", "Insufficient permissions"));
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map