import type { Response } from "express";

/** Standard success response */
export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/** Standard error response */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
) {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}

/** Paginated list response */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
