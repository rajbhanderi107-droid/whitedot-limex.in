import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { chatConfigured, generateChatReply, type ChatMessage } from "../services/chat.service.js";

/**
 * POST /api/public/chat
 * Body: { messages: [{ role, content }, ...] }  (validated by chatSchema)
 * Returns: { reply: string }
 */
export async function chat(req: Request, res: Response) {
  if (!chatConfigured()) {
    return sendError(
      res,
      "CHAT_UNAVAILABLE",
      "The LIMEX assistant is not available right now. Please reach us on WhatsApp at +91 88497 28938.",
      503,
    );
  }

  const messages = req.body.messages as ChatMessage[];

  // The last turn must come from the user — otherwise there is nothing to answer.
  if (messages[messages.length - 1]?.role !== "user") {
    return sendError(res, "INVALID_CONVERSATION", "The last message must be from the user.", 400);
  }

  try {
    const reply = await generateChatReply(messages);
    return sendSuccess(res, { reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "The assistant could not respond. Please try again.";
    return sendError(res, "CHAT_FAILED", message, 502);
  }
}
