export declare const aiDraftConfigured: () => boolean;
export type DraftKind = "followup_email" | "followup_whatsapp" | "proposal_intro" | "reactivation";
export interface LeadContext {
    name: string;
    company?: string;
    status?: string;
    industry?: string;
    product?: string;
    notes?: string;
}
export declare function generateDraft(kind: DraftKind, lead: LeadContext): Promise<string>;
//# sourceMappingURL=aiDraft.service.d.ts.map