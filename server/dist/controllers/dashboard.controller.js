import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
export async function getDashboard(_req, res) {
    const [totalInquiries, newInquiries, wonInquiries, lostInquiries, totalQuoteRequests, newQuoteRequests, totalSampleRequests, totalCalculatorSubmissions, pendingFollowUps, totalCompanies, recentActivity,] = await Promise.all([
        prisma.inquiry.count(),
        prisma.inquiry.count({ where: { status: "NEW" } }),
        prisma.inquiry.count({ where: { status: "WON" } }),
        prisma.inquiry.count({ where: { status: "LOST" } }),
        prisma.quoteRequest.count(),
        prisma.quoteRequest.count({ where: { status: "NEW" } }),
        prisma.sampleRequest.count(),
        prisma.calculatorSubmission.count(),
        prisma.followUpTask.count({ where: { status: "PENDING" } }),
        prisma.company.count(),
        prisma.activityLog.findMany({
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
            take: 15,
        }),
    ]);
    return sendSuccess(res, {
        totalInquiries,
        newInquiries,
        wonInquiries,
        lostInquiries,
        totalQuoteRequests,
        newQuoteRequests,
        totalSampleRequests,
        totalCalculatorSubmissions,
        pendingFollowUps,
        totalCompanies,
        recentActivity,
    });
}
//# sourceMappingURL=dashboard.controller.js.map