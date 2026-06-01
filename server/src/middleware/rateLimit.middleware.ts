import rateLimit from "express-rate-limit";

/** Public form endpoints — generous but safe */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 30,                     // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please try again in a few minutes.",
    },
  },
});

/** LIMEX Assistant chat — protects the free LLM tier from abuse */
export const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                     // 20 messages per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "You have sent a lot of messages. Please wait a few minutes and try again.",
    },
  },
});

/** Auth endpoints — tighter to prevent brute force */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many login attempts. Please try again later.",
    },
  },
});

/** Admin endpoints — reasonable for dashboard use, protects against abuse */
export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute
  max: 120,                    // 120 req/min — covers rapid page navigation
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests. Please slow down.",
    },
  },
});
