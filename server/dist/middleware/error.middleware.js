import { ZodError } from "zod";
import { env } from "../config/env.js";
/** Application-level error with an HTTP status code */
export class AppError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
    }
}
/** Central error handler — must be registered LAST on the Express app */
export function errorHandler(err, _req, res, _next) {
    // Zod validation errors
    if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
        res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid input",
                details: messages,
            },
        });
        return;
    }
    // Known application errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
        return;
    }
    // Unexpected errors — hide stack in production
    console.error("[UNHANDLED]", err);
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: env.isProduction
                ? "Something went wrong. Please try again later."
                : err.message,
        },
    });
}
//# sourceMappingURL=error.middleware.js.map