import { z } from "zod";
export declare const publicInquirySchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    inquiryType: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    sourcePage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    phone?: string | undefined;
    companyName?: string | undefined;
    designation?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    inquiryType?: string | undefined;
    message?: string | undefined;
    sourcePage?: string | undefined;
}, {
    name: string;
    email: string;
    phone?: string | undefined;
    companyName?: string | undefined;
    designation?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    inquiryType?: string | undefined;
    message?: string | undefined;
    sourcePage?: string | undefined;
}>;
export declare const publicQuoteRequestSchema: z.ZodObject<{
    contactPerson: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    productCategory: z.ZodOptional<z.ZodString>;
    currentMaterial: z.ZodOptional<z.ZodString>;
    currentPlasticGrade: z.ZodOptional<z.ZodString>;
    monthlyQuantity: z.ZodOptional<z.ZodString>;
    targetApplication: z.ZodOptional<z.ZodString>;
    strengthRequirement: z.ZodOptional<z.ZodString>;
    foodContactRequired: z.ZodOptional<z.ZodBoolean>;
    colorRequirement: z.ZodOptional<z.ZodString>;
    sustainabilityGoal: z.ZodOptional<z.ZodString>;
    expectedPriceRange: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    contactPerson: string;
    phone?: string | undefined;
    companyName?: string | undefined;
    message?: string | undefined;
    productCategory?: string | undefined;
    currentMaterial?: string | undefined;
    currentPlasticGrade?: string | undefined;
    monthlyQuantity?: string | undefined;
    targetApplication?: string | undefined;
    strengthRequirement?: string | undefined;
    foodContactRequired?: boolean | undefined;
    colorRequirement?: string | undefined;
    sustainabilityGoal?: string | undefined;
    expectedPriceRange?: string | undefined;
}, {
    email: string;
    contactPerson: string;
    phone?: string | undefined;
    companyName?: string | undefined;
    message?: string | undefined;
    productCategory?: string | undefined;
    currentMaterial?: string | undefined;
    currentPlasticGrade?: string | undefined;
    monthlyQuantity?: string | undefined;
    targetApplication?: string | undefined;
    strengthRequirement?: string | undefined;
    foodContactRequired?: boolean | undefined;
    colorRequirement?: string | undefined;
    sustainabilityGoal?: string | undefined;
    expectedPriceRange?: string | undefined;
}>;
export declare const publicSampleRequestSchema: z.ZodObject<{
    contactPerson: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    requestedMaterialType: z.ZodOptional<z.ZodString>;
    application: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodString>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    contactPerson: string;
    phone?: string | undefined;
    companyName?: string | undefined;
    requestedMaterialType?: string | undefined;
    application?: string | undefined;
    quantity?: string | undefined;
    deliveryAddress?: string | undefined;
    remarks?: string | undefined;
}, {
    email: string;
    contactPerson: string;
    phone?: string | undefined;
    companyName?: string | undefined;
    requestedMaterialType?: string | undefined;
    application?: string | undefined;
    quantity?: string | undefined;
    deliveryAddress?: string | undefined;
    remarks?: string | undefined;
}>;
export declare const chatSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "user" | "assistant";
        content: string;
    }, {
        role: "user" | "assistant";
        content: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "user" | "assistant";
        content: string;
    }[];
}, {
    messages: {
        role: "user" | "assistant";
        content: string;
    }[];
}>;
export declare const calculatorSubmissionSchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    plasticType: z.ZodOptional<z.ZodString>;
    currentGrade: z.ZodOptional<z.ZodString>;
    currentQuantity: z.ZodOptional<z.ZodString>;
    limexReplacementPercentage: z.ZodOptional<z.ZodNumber>;
    estimatedCostSaving: z.ZodOptional<z.ZodNumber>;
    estimatedPlasticReduction: z.ZodOptional<z.ZodNumber>;
    estimatedCo2Impact: z.ZodOptional<z.ZodNumber>;
    assumptionsUsed: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    companyName?: string | undefined;
    contactPerson?: string | undefined;
    plasticType?: string | undefined;
    currentGrade?: string | undefined;
    currentQuantity?: string | undefined;
    limexReplacementPercentage?: number | undefined;
    estimatedCostSaving?: number | undefined;
    estimatedPlasticReduction?: number | undefined;
    estimatedCo2Impact?: number | undefined;
    assumptionsUsed?: Record<string, unknown> | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    companyName?: string | undefined;
    contactPerson?: string | undefined;
    plasticType?: string | undefined;
    currentGrade?: string | undefined;
    currentQuantity?: string | undefined;
    limexReplacementPercentage?: number | undefined;
    estimatedCostSaving?: number | undefined;
    estimatedPlasticReduction?: number | undefined;
    estimatedCo2Impact?: number | undefined;
    assumptionsUsed?: Record<string, unknown> | undefined;
}>;
//# sourceMappingURL=public.validator.d.ts.map