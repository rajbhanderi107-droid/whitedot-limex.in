import type { Request, Response } from "express";
export declare function listSettings(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateSetting(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
/**
 * Upsert the site logo. Stored as a base64 data URL (uploaded image) or an
 * http(s) URL; an empty value resets to the bundled default. Upsert is used so
 * this works even on databases seeded before the brand_logo key existed.
 */
export declare function updateBrandLogo(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=settings.controller.d.ts.map