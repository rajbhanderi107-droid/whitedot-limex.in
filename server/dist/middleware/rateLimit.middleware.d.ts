/** Public form endpoints — generous but safe */
export declare const publicLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** LIMEX Assistant chat — protects the free LLM tier from abuse */
export declare const chatLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** Auth endpoints — tighter to prevent brute force */
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
/** Admin endpoints — reasonable for dashboard use, protects against abuse */
export declare const adminLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.middleware.d.ts.map