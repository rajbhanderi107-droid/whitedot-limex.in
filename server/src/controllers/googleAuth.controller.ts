import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { signToken, setAuthCookie } from "../utils/tokens.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { logActivity } from "../services/activity.service.js";
import { AppError } from "../middleware/error.middleware.js";

/**
 * Google OAuth callback handler.
 *
 * Flow:
 *   1. Frontend opens Google consent screen
 *   2. Frontend POSTs `{ accessToken }` to this endpoint
 *   3. We verify the access token with Google userinfo
 *   5. Match email to an existing User row (no auto-registration — admin-only)
 *   6. Issue our JWT cookie + token
 */

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

/** Exchange authorization code for Google tokens */
async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const backendUrl = env.isProduction
    ? `${env.FRONTEND_URL.replace(/\/$/, "")}`
    : `http://localhost:${env.PORT}`;

  // "postmessage" is Google's special redirect_uri for popup-based OAuth flows.
  // The frontend uses google.accounts.oauth2.initCodeClient() which returns the
  // auth code directly via postMessage — no redirect needed.
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(401, "GOOGLE_AUTH_FAILED", `Google token exchange failed: ${body}`);
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

/** Fetch Google user profile using access token */
async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new AppError(401, "GOOGLE_AUTH_FAILED", "Failed to fetch Google user info");
  }

  return res.json() as Promise<GoogleUserInfo>;
}

/**
 * POST /api/auth/google
 * Body: { accessToken: string } or legacy { code: string }
 *
 * Exchanges a browser-issued Google access token for a session.
 * Only allows login for existing, active users — no auto-registration.
 */
export async function googleLogin(req: Request, res: Response) {
  if (!env.googleOAuthEnabled) {
    throw new AppError(501, "GOOGLE_AUTH_DISABLED", "Google authentication is not configured");
  }

  const { accessToken, code } = req.body;
  let googleUser: GoogleUserInfo;

  if (typeof accessToken === "string" && accessToken.trim()) {
    googleUser = await getGoogleUserInfo(accessToken);
  } else if (typeof code === "string" && code.trim()) {
    if (!env.googleCodeOAuthEnabled) {
      throw new AppError(
        501,
        "GOOGLE_CODE_AUTH_DISABLED",
        "Google code exchange requires GOOGLE_CLIENT_SECRET. Use the browser token flow or set the secret in Render."
      );
    }
    const tokens = await exchangeCodeForTokens(code);
    googleUser = await getGoogleUserInfo(tokens.access_token);
  } else {
    throw new AppError(400, "INVALID_GOOGLE_CREDENTIAL", "Google access token is required");
  }

  if (googleUser.email_verified === false) {
    throw new AppError(401, "EMAIL_NOT_VERIFIED", "Google email is not verified");
  }

  // Find matching user in our database
  const user = await prisma.user.findUnique({
    where: { email: googleUser.email },
  });

  if (!user) {
    throw new AppError(
      403,
      "USER_NOT_FOUND",
      `No account exists for ${googleUser.email}. Contact an administrator to create your account.`
    );
  }

  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Account is inactive. Contact an administrator.");
  }

  // Issue JWT
  const token = signToken({ userId: user.id, role: user.role });
  setAuthCookie(res, token);

  await logActivity({
    userId: user.id,
    action: "LOGIN_GOOGLE",
    entityType: "USER",
    entityId: user.id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  return sendSuccess(
    res,
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    },
    "Google login successful"
  );
}

/**
 * GET /api/auth/google/config
 * Returns the Google OAuth client ID + redirect URI for the frontend.
 * No secrets exposed.
 */
export async function googleConfig(_req: Request, res: Response) {
  if (!env.googleOAuthEnabled) {
    return sendSuccess(res, { enabled: false });
  }

  return sendSuccess(res, {
    enabled: true,
    clientId: env.GOOGLE_CLIENT_ID,
    flow: "token",
  });
}
