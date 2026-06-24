export interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}
export declare const chatConfigured: () => boolean;
/**
 * Send the conversation to the LLM and return the assistant's reply text.
 * Throws on transport/provider failure so the controller can map it to a 502.
 */
export declare function generateChatReply(history: ChatMessage[]): Promise<string>;
//# sourceMappingURL=chat.service.d.ts.map