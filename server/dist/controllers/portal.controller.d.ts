/**
 * Infinity Growth OS — portal control-plane endpoints.
 *
 * Everything here is real: state and queues persist in Postgres, AI drafts
 * call the configured LLM and land in the approval queue, BI aggregates are
 * computed from live CRM tables, health checks measure the actual stack,
 * the SEO audit fetches and parses the live site, and DevOps status reads
 * the repository's GitHub Actions runs.
 */
import type { Request, Response } from "express";
export declare function getPortalState(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updatePortalState(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listAutomations(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function upsertAutomation(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listApprovals(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createApproval(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function decideApproval(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listWorkflows(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createWorkflow(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteWorkflow(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listIncidents(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createIncident(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function updateIncident(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function deleteIncident(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listIntegrations(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function upsertIntegration(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function listAiAgents(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function upsertAiAgent(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function createAiDraft(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getBiSummary(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getDetailedHealth(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getSeoAudit(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getDevopsRuns(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getBackupStats(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function exportBackup(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getSecuritySummary(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
export declare function getAiStats(_req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=portal.controller.d.ts.map