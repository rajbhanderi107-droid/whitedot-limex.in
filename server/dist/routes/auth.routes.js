import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/auth.validator.js";
import * as auth from "../controllers/auth.controller.js";
import * as googleAuth from "../controllers/googleAuth.controller.js";
const router = Router();
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(auth.login));
router.post("/logout", requireAuth, asyncHandler(auth.logout));
router.get("/me", requireAuth, asyncHandler(auth.me));
// Password reset (public, rate-limited)
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), asyncHandler(auth.forgotPassword));
router.get("/verify-reset-token/:token", authLimiter, asyncHandler(auth.verifyResetToken));
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), asyncHandler(auth.resetPassword));
// Google OAuth
router.get("/google/config", asyncHandler(googleAuth.googleConfig));
router.post("/google", authLimiter, asyncHandler(googleAuth.googleLogin));
export default router;
//# sourceMappingURL=auth.routes.js.map