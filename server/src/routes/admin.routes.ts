import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import * as dashboard from "../controllers/dashboard.controller.js";
import * as inquiries from "../controllers/inquiry.controller.js";
import * as quotes from "../controllers/quoteRequest.controller.js";
import * as samples from "../controllers/sampleRequest.controller.js";
import * as companies from "../controllers/company.controller.js";
import * as calculator from "../controllers/calculator.controller.js";
import * as followUps from "../controllers/followUp.controller.js";
import * as documents from "../controllers/document.controller.js";
import * as settings from "../controllers/settings.controller.js";
import * as users from "../controllers/user.controller.js";
import * as notifications from "../controllers/notification.controller.js";
import * as activityLog from "../controllers/activityLog.controller.js";
import {
  updateInquirySchema,
  updateQuoteRequestSchema,
  updateSampleRequestSchema,
  createCompanySchema,
  updateCompanySchema,
  createAdminNoteSchema,
  createFollowUpTaskSchema,
  updateFollowUpTaskSchema,
  createDocumentSchema,
  updateWebsiteSettingSchema,
  createUserSchema,
  updateUserSchema,
} from "../validators/admin.validator.js";

const router = Router();

// All admin routes require authentication
router.use(requireAuth);

// ─── Dashboard ───────────────────────────────────
router.get("/dashboard", asyncHandler(dashboard.getDashboard));

// ─── Inquiries ───────────────────────────────────
router.get("/inquiries", asyncHandler(inquiries.listInquiries));
router.get("/inquiries/:id", asyncHandler(inquiries.getInquiry));
router.patch("/inquiries/:id", validate(updateInquirySchema), asyncHandler(inquiries.updateInquiry));
router.delete("/inquiries/:id", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(inquiries.deleteInquiry));
router.post("/inquiries/:id/notes", validate(createAdminNoteSchema), asyncHandler(inquiries.addInquiryNote));

// ─── Quote Requests ──────────────────────────────
router.get("/quote-requests", asyncHandler(quotes.listQuoteRequests));
router.get("/quote-requests/:id", asyncHandler(quotes.getQuoteRequest));
router.patch("/quote-requests/:id", validate(updateQuoteRequestSchema), asyncHandler(quotes.updateQuoteRequest));
router.delete("/quote-requests/:id", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(quotes.deleteQuoteRequest));

// ─── Sample Requests ─────────────────────────────
router.get("/sample-requests", asyncHandler(samples.listSampleRequests));
router.get("/sample-requests/:id", asyncHandler(samples.getSampleRequest));
router.patch("/sample-requests/:id", validate(updateSampleRequestSchema), asyncHandler(samples.updateSampleRequest));
router.delete("/sample-requests/:id", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(samples.deleteSampleRequest));

// ─── Companies ───────────────────────────────────
router.get("/companies", asyncHandler(companies.listCompanies));
router.get("/companies/:id", asyncHandler(companies.getCompany));
router.post("/companies", validate(createCompanySchema), asyncHandler(companies.createCompany));
router.patch("/companies/:id", validate(updateCompanySchema), asyncHandler(companies.updateCompany));
router.delete("/companies/:id", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(companies.deleteCompany));

// ─── Calculator Submissions ──────────────────────
router.get("/calculator-submissions", asyncHandler(calculator.listCalculatorSubmissions));
router.get("/calculator-submissions/:id", asyncHandler(calculator.getCalculatorSubmission));
router.patch("/calculator-submissions/:id/convert-to-lead", asyncHandler(calculator.convertToLead));

// ─── Follow-ups ──────────────────────────────────
router.get("/follow-ups", asyncHandler(followUps.listFollowUps));
router.post("/follow-ups", validate(createFollowUpTaskSchema), asyncHandler(followUps.createFollowUp));
router.patch("/follow-ups/:id", validate(updateFollowUpTaskSchema), asyncHandler(followUps.updateFollowUp));
router.delete("/follow-ups/:id", asyncHandler(followUps.deleteFollowUp));

// ─── Documents ───────────────────────────────────
router.get("/documents", asyncHandler(documents.listDocuments));
router.post("/documents", validate(createDocumentSchema), asyncHandler(documents.createDocument));
router.patch("/documents/:id", asyncHandler(documents.updateDocument));
router.delete("/documents/:id", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(documents.deleteDocument));

// ─── Website Settings ────────────────────────────
router.get("/website-settings", asyncHandler(settings.listSettings));
router.patch("/website-settings/:key", requireRole("SUPER_ADMIN", "ADMIN"), validate(updateWebsiteSettingSchema), asyncHandler(settings.updateSetting));

// ─── Users (SUPER_ADMIN only) ────────────────────
router.get("/users", requireRole("SUPER_ADMIN"), asyncHandler(users.listUsers));
router.post("/users", requireRole("SUPER_ADMIN"), validate(createUserSchema), asyncHandler(users.createUser));
router.patch("/users/:id", requireRole("SUPER_ADMIN"), validate(updateUserSchema), asyncHandler(users.updateUser));

// ─── Notifications ───────────────────────────────
router.get("/notifications", asyncHandler(notifications.listNotifications));
router.patch("/notifications/:id/read", asyncHandler(notifications.markRead));
router.patch("/notifications/read-all", asyncHandler(notifications.markAllRead));

// ─── Activity Log (ADMIN+) ───────────────────────
router.get("/activity-log", requireRole("SUPER_ADMIN", "ADMIN"), asyncHandler(activityLog.listActivityLogs));

export default router;
