import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { loginSchema } from "../validators/auth.validator.js";
import * as auth from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", authLimiter, validate(loginSchema), asyncHandler(auth.login));
router.post("/logout", requireAuth, asyncHandler(auth.logout));
router.get("/me", requireAuth, asyncHandler(auth.me));

export default router;
