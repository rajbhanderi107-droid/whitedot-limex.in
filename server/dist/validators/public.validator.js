import { z } from "zod";
export const publicInquirySchema = z.object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z.string().max(30).optional(),
    companyName: z.string().max(200).optional(),
    designation: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    industry: z.string().max(200).optional(),
    inquiryType: z.string().max(100).optional(),
    message: z.string().max(5000).optional(),
    sourcePage: z.string().max(200).optional(),
}).strip();
export const publicQuoteRequestSchema = z.object({
    contactPerson: z.string().min(1, "Contact person is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z.string().max(30).optional(),
    companyName: z.string().max(200).optional(),
    productCategory: z.string().max(200).optional(),
    currentMaterial: z.string().max(200).optional(),
    currentPlasticGrade: z.string().max(200).optional(),
    monthlyQuantity: z.string().max(100).optional(),
    targetApplication: z.string().max(500).optional(),
    strengthRequirement: z.string().max(500).optional(),
    foodContactRequired: z.boolean().optional(),
    colorRequirement: z.string().max(200).optional(),
    sustainabilityGoal: z.string().max(500).optional(),
    expectedPriceRange: z.string().max(200).optional(),
    message: z.string().max(5000).optional(),
}).strip();
export const publicSampleRequestSchema = z.object({
    contactPerson: z.string().min(1, "Contact person is required").max(200),
    email: z.string().email("Valid email is required"),
    phone: z.string().max(30).optional(),
    companyName: z.string().max(200).optional(),
    requestedMaterialType: z.string().max(200).optional(),
    application: z.string().max(500).optional(),
    quantity: z.string().max(100).optional(),
    deliveryAddress: z.string().max(1000).optional(),
    remarks: z.string().max(2000).optional(),
}).strip();
export const chatSchema = z.object({
    // Full conversation so far, oldest first. Capped to keep token use bounded.
    messages: z
        .array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1, "Message cannot be empty").max(2000),
    }))
        .min(1, "At least one message is required")
        .max(20, "Conversation is too long. Please start a new chat."),
}).strip();
export const calculatorSubmissionSchema = z.object({
    companyName: z.string().max(200).optional(),
    contactPerson: z.string().max(200).optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().max(30).optional(),
    plasticType: z.string().max(200).optional(),
    currentGrade: z.string().max(200).optional(),
    currentQuantity: z.string().max(100).optional(),
    limexReplacementPercentage: z.number().min(0).max(100).optional(),
    estimatedCostSaving: z.number().optional(),
    estimatedPlasticReduction: z.number().optional(),
    estimatedCo2Impact: z.number().optional(),
    assumptionsUsed: z.record(z.unknown()).optional(),
}).strip();
//# sourceMappingURL=public.validator.js.map