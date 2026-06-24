import type { Request, Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
/** Verify JWT from Authorization header and attach currentUser to request */
export declare function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void>;
/** Factory: require one of the specified roles */
export declare function requireRole(...roles: Role[]): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map