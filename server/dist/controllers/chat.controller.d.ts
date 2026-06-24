import type { Request, Response } from "express";
/**
 * POST /api/public/chat
 * Body: { messages: [{ role, content }, ...] }  (validated by chatSchema)
 * Returns: { reply: string }
 */
export declare function chat(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=chat.controller.d.ts.map