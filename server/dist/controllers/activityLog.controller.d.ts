import type { Request, Response } from "express";
export declare function listActivityLogs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/** Delete a single activity-log entry. SUPER_ADMIN only (enforced at the route). */
export declare function deleteActivityLog(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/** Delete every activity-log entry. SUPER_ADMIN only (enforced at the route). */
export declare function deleteAllActivityLogs(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=activityLog.controller.d.ts.map