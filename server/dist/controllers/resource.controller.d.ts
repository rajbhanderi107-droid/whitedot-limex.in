/**
 * Generic CRUD endpoints for portal business resources (PIM products,
 * inventory, quotations, orders, campaigns, content items, bug reports).
 *
 * One factory, seven typed resources — each with its own Zod schema and
 * Prisma delegate. Every write is audit-logged. List supports ?search=
 * (name/title contains) and ?kind= / ?status= filters.
 */
import type { Request, Response } from "express";
export declare function listResource(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createResource(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateResource(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteResource(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=resource.controller.d.ts.map