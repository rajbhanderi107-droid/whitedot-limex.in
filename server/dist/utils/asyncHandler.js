/**
 * Wraps an async route handler so rejected promises are forwarded
 * to Express's error middleware instead of crashing the process.
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map