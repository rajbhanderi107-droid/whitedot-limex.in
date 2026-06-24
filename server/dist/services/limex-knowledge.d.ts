/**
 * Curated LIMEX knowledge base + system prompt for the LIMEX Assistant.
 *
 * This is the single source of truth the assistant answers from. The corpus is
 * small and fixed, so it lives inline (no RAG / vector DB needed). All facts here
 * are drawn from the site's own copy (src/App.tsx, src/god-wd) and official TBM
 * references — keep it in sync if the site copy changes.
 *
 * Voice: procurement-grade, mineral, direct. Never breezy, never emoji.
 */
export declare const LIMEX_SYSTEM_PROMPT: string;
//# sourceMappingURL=limex-knowledge.d.ts.map