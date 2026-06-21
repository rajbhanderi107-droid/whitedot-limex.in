import type { Context } from 'hono';

export const sendSuccess = (c: Context, data: unknown, message?: string, status = 200) =>
  c.json({ success: true, data, ...(message && { message }) }, status as Parameters<Context['json']>[1]);

export const sendError = (c: Context, code: string, message: string, status = 400) =>
  c.json({ success: false, error: { code, message } }, status as Parameters<Context['json']>[1]);

export const sendPaginated = (c: Context, data: unknown[], total: number, page: number, limit: number) =>
  c.json({ success: true, data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
