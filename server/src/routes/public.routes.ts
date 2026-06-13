import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { publicLimiter, chatLimiter } from "../middleware/rateLimit.middleware.js";
import {
  publicInquirySchema,
  publicQuoteRequestSchema,
  publicSampleRequestSchema,
  calculatorSubmissionSchema,
  chatSchema,
} from "../validators/public.validator.js";
import * as pub from "../controllers/public.controller.js";
import { chat } from "../controllers/chat.controller.js";

const router = Router();

router.use(publicLimiter);

router.post("/inquiry", validate(publicInquirySchema), asyncHandler(pub.submitInquiry));
router.post("/quote-request", validate(publicQuoteRequestSchema), asyncHandler(pub.submitQuoteRequest));
router.post("/sample-request", validate(publicSampleRequestSchema), asyncHandler(pub.submitSampleRequest));
router.post("/calculator-submission", validate(calculatorSubmissionSchema), asyncHandler(pub.submitCalculatorSubmission));
router.get("/settings", asyncHandler(pub.getWebsiteSettings));

// LIMEX Assistant — tighter, chat-specific rate limit overrides the default.
router.post("/chat", chatLimiter, validate(chatSchema), asyncHandler(chat));
router.get("/google-overview", asyncHandler(pub.getGoogleOverview));

export default router;
