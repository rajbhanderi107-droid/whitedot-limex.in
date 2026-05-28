import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { publicLimiter } from "../middleware/rateLimit.middleware.js";
import {
  publicInquirySchema,
  publicQuoteRequestSchema,
  publicSampleRequestSchema,
  calculatorSubmissionSchema,
} from "../validators/public.validator.js";
import * as pub from "../controllers/public.controller.js";

const router = Router();

router.use(publicLimiter);

router.post("/inquiry", validate(publicInquirySchema), asyncHandler(pub.submitInquiry));
router.post("/quote-request", validate(publicQuoteRequestSchema), asyncHandler(pub.submitQuoteRequest));
router.post("/sample-request", validate(publicSampleRequestSchema), asyncHandler(pub.submitSampleRequest));
router.post("/calculator-submission", validate(calculatorSubmissionSchema), asyncHandler(pub.submitCalculatorSubmission));

export default router;
