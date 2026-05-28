import type { Request } from "express";
import { AppError } from "../middleware/error.middleware.js";

/** Safely extract a string param from Express 5 req.params (which may be string | string[]). */
export function paramId(req: Request, name = "id"): string {
  const val = req.params[name];
  const str = Array.isArray(val) ? val[0] : val;
  if (!str) throw new AppError(400, "MISSING_PARAM", `Missing required parameter: ${name}`);
  return str;
}
