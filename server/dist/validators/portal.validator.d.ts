import { z } from "zod";
export declare const automationModeEnum: z.ZodEnum<["OFF", "DRAFT", "APPROVAL", "AUTO", "LOCKDOWN"]>;
export declare const riskLevelEnum: z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>;
export declare const updatePortalStateSchema: z.ZodObject<{
    automationMode: z.ZodOptional<z.ZodEnum<["OFF", "DRAFT", "APPROVAL", "AUTO", "LOCKDOWN"]>>;
    emergencyStop: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    automationMode?: "APPROVAL" | "OFF" | "DRAFT" | "AUTO" | "LOCKDOWN" | undefined;
    emergencyStop?: boolean | undefined;
}, {
    automationMode?: "APPROVAL" | "OFF" | "DRAFT" | "AUTO" | "LOCKDOWN" | undefined;
    emergencyStop?: boolean | undefined;
}>;
export declare const upsertAutomationSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    mode: z.ZodOptional<z.ZodEnum<["OFF", "DRAFT", "APPROVAL", "AUTO", "LOCKDOWN"]>>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    mode?: "APPROVAL" | "OFF" | "DRAFT" | "AUTO" | "LOCKDOWN" | undefined;
}, {
    enabled?: boolean | undefined;
    mode?: "APPROVAL" | "OFF" | "DRAFT" | "AUTO" | "LOCKDOWN" | undefined;
}>;
export declare const createApprovalSchema: z.ZodObject<{
    title: z.ZodString;
    kind: z.ZodString;
    automationId: z.ZodOptional<z.ZodString>;
    risk: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    preview: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    kind: string;
    preview: string;
    automationId?: string | undefined;
    risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}, {
    title: string;
    kind: string;
    preview: string;
    automationId?: string | undefined;
    risk?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | undefined;
}>;
export declare const decideApprovalSchema: z.ZodObject<{
    decision: z.ZodEnum<["APPROVED", "REJECTED"]>;
}, "strip", z.ZodTypeAny, {
    decision: "APPROVED" | "REJECTED";
}, {
    decision: "APPROVED" | "REJECTED";
}>;
export declare const createWorkflowSchema: z.ZodObject<{
    name: z.ZodString;
    trigger: z.ZodString;
    condition: z.ZodString;
    action: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    action: string;
    trigger: string;
    condition: string;
}, {
    name: string;
    action: string;
    trigger: string;
    condition: string;
}>;
export declare const createIncidentSchema: z.ZodObject<{
    title: z.ZodString;
    severity: z.ZodEnum<["SEV0", "SEV1", "SEV2", "SEV3", "SEV4"]>;
    playbook: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    severity: "SEV0" | "SEV1" | "SEV2" | "SEV3" | "SEV4";
    playbook: string;
}, {
    title: string;
    severity: "SEV0" | "SEV1" | "SEV2" | "SEV3" | "SEV4";
    playbook: string;
}>;
export declare const updateIncidentSchema: z.ZodObject<{
    stage: z.ZodEnum<["DETECTED", "TRIAGE", "CONTAINED", "INVESTIGATING", "FIXING", "RECOVERING", "RESOLVED"]>;
}, "strip", z.ZodTypeAny, {
    stage: "DETECTED" | "TRIAGE" | "CONTAINED" | "INVESTIGATING" | "FIXING" | "RECOVERING" | "RESOLVED";
}, {
    stage: "DETECTED" | "TRIAGE" | "CONTAINED" | "INVESTIGATING" | "FIXING" | "RECOVERING" | "RESOLVED";
}>;
export declare const upsertIntegrationSchema: z.ZodObject<{
    connected: z.ZodOptional<z.ZodBoolean>;
    environment: z.ZodOptional<z.ZodEnum<["sandbox", "production"]>>;
}, "strip", z.ZodTypeAny, {
    connected?: boolean | undefined;
    environment?: "production" | "sandbox" | undefined;
}, {
    connected?: boolean | undefined;
    environment?: "production" | "sandbox" | undefined;
}>;
export declare const upsertAiAgentSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    mode: z.ZodOptional<z.ZodEnum<["OFF", "DRAFT", "APPROVAL", "AUTO", "LOCKDOWN"]>>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
    mode?: "APPROVAL" | "OFF" | "DRAFT" | "AUTO" | "LOCKDOWN" | undefined;
}, {
    enabled?: boolean | undefined;
    mode?: "APPROVAL" | "OFF" | "DRAFT" | "AUTO" | "LOCKDOWN" | undefined;
}>;
export declare const aiDraftSchema: z.ZodObject<{
    /** What kind of draft to write. */
    kind: z.ZodEnum<["followup_email", "followup_whatsapp", "proposal_intro", "reactivation"]>;
    /** Lead context assembled by the client (no secrets). */
    lead: z.ZodObject<{
        name: z.ZodString;
        company: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        industry: z.ZodOptional<z.ZodString>;
        product: z.ZodOptional<z.ZodString>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        industry?: string | undefined;
        status?: string | undefined;
        company?: string | undefined;
        product?: string | undefined;
        notes?: string | undefined;
    }, {
        name: string;
        industry?: string | undefined;
        status?: string | undefined;
        company?: string | undefined;
        product?: string | undefined;
        notes?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    kind: "followup_email" | "followup_whatsapp" | "proposal_intro" | "reactivation";
    lead: {
        name: string;
        industry?: string | undefined;
        status?: string | undefined;
        company?: string | undefined;
        product?: string | undefined;
        notes?: string | undefined;
    };
}, {
    kind: "followup_email" | "followup_whatsapp" | "proposal_intro" | "reactivation";
    lead: {
        name: string;
        industry?: string | undefined;
        status?: string | undefined;
        company?: string | undefined;
        product?: string | undefined;
        notes?: string | undefined;
    };
}>;
//# sourceMappingURL=portal.validator.d.ts.map