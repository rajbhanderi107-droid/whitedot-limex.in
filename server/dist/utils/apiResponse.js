/** Standard success response */
export function sendSuccess(res, data, message, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        ...(message && { message }),
    });
}
/** Standard error response */
export function sendError(res, code, message, statusCode = 400) {
    return res.status(statusCode).json({
        success: false,
        error: { code, message },
    });
}
/** Paginated list response */
export function sendPaginated(res, data, total, page, limit) {
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
//# sourceMappingURL=apiResponse.js.map