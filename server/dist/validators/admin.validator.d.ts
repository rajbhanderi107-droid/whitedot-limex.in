import { z } from "zod";
export declare const createCompanySchema: z.ZodObject<{
    companyName: z.ZodString;
    industry: z.ZodOptional<z.ZodString>;
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodOptional<z.ZodString>;
    website: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    gstNumber: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["LEAD", "ACTIVE_CLIENT", "INACTIVE", "BLACKLISTED"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    companyName: string;
    email?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    status?: "LEAD" | "ACTIVE_CLIENT" | "INACTIVE" | "BLACKLISTED" | undefined;
    contactPerson?: string | undefined;
    website?: string | undefined;
    state?: string | undefined;
    address?: string | undefined;
    gstNumber?: string | undefined;
    notes?: string | undefined;
}, {
    companyName: string;
    email?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    status?: "LEAD" | "ACTIVE_CLIENT" | "INACTIVE" | "BLACKLISTED" | undefined;
    contactPerson?: string | undefined;
    website?: string | undefined;
    state?: string | undefined;
    address?: string | undefined;
    gstNumber?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updateCompanySchema: z.ZodObject<{
    companyName: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactPerson: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    gstNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["LEAD", "ACTIVE_CLIENT", "INACTIVE", "BLACKLISTED"]>>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    companyName?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    status?: "LEAD" | "ACTIVE_CLIENT" | "INACTIVE" | "BLACKLISTED" | undefined;
    contactPerson?: string | undefined;
    website?: string | undefined;
    state?: string | undefined;
    address?: string | undefined;
    gstNumber?: string | undefined;
    notes?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    companyName?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    status?: "LEAD" | "ACTIVE_CLIENT" | "INACTIVE" | "BLACKLISTED" | undefined;
    contactPerson?: string | undefined;
    website?: string | undefined;
    state?: string | undefined;
    address?: string | undefined;
    gstNumber?: string | undefined;
    notes?: string | undefined;
}>;
export declare const updateInquirySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    inquiryType: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST", "ARCHIVED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    assignedToId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    companyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    internalNotes: z.ZodOptional<z.ZodString>;
    followUpDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    companyName?: string | undefined;
    designation?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    inquiryType?: string | undefined;
    message?: string | undefined;
    status?: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "WON" | "LOST" | "ARCHIVED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    internalNotes?: string | undefined;
    followUpDate?: string | null | undefined;
    assignedToId?: string | null | undefined;
    companyId?: string | null | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    companyName?: string | undefined;
    designation?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    industry?: string | undefined;
    inquiryType?: string | undefined;
    message?: string | undefined;
    status?: "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL_SENT" | "WON" | "LOST" | "ARCHIVED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    internalNotes?: string | undefined;
    followUpDate?: string | null | undefined;
    assignedToId?: string | null | undefined;
    companyId?: string | null | undefined;
}>;
export declare const updateQuoteRequestSchema: z.ZodObject<{
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
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
    status: z.ZodOptional<z.ZodEnum<["NEW", "UNDER_REVIEW", "NEED_MORE_INFO", "QUOTED", "NEGOTIATION", "APPROVED", "REJECTED", "CLOSED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    assignedToId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    companyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    message?: string | undefined;
    status?: "NEW" | "UNDER_REVIEW" | "NEED_MORE_INFO" | "QUOTED" | "NEGOTIATION" | "APPROVED" | "REJECTED" | "CLOSED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToId?: string | null | undefined;
    companyId?: string | null | undefined;
    contactPerson?: string | undefined;
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
    email?: string | undefined;
    phone?: string | undefined;
    message?: string | undefined;
    status?: "NEW" | "UNDER_REVIEW" | "NEED_MORE_INFO" | "QUOTED" | "NEGOTIATION" | "APPROVED" | "REJECTED" | "CLOSED" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    assignedToId?: string | null | undefined;
    companyId?: string | null | undefined;
    contactPerson?: string | undefined;
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
export declare const updateSampleRequestSchema: z.ZodObject<{
    contactPerson: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    requestedMaterialType: z.ZodOptional<z.ZodString>;
    application: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodString>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
    courierTracking: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["REQUESTED", "APPROVED", "REJECTED", "DISPATCHED", "DELIVERED", "CANCELLED"]>>;
    remarks: z.ZodOptional<z.ZodString>;
    companyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    status?: "APPROVED" | "REJECTED" | "CANCELLED" | "REQUESTED" | "DISPATCHED" | "DELIVERED" | undefined;
    companyId?: string | null | undefined;
    contactPerson?: string | undefined;
    requestedMaterialType?: string | undefined;
    application?: string | undefined;
    quantity?: string | undefined;
    deliveryAddress?: string | undefined;
    courierTracking?: string | undefined;
    remarks?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    status?: "APPROVED" | "REJECTED" | "CANCELLED" | "REQUESTED" | "DISPATCHED" | "DELIVERED" | undefined;
    companyId?: string | null | undefined;
    contactPerson?: string | undefined;
    requestedMaterialType?: string | undefined;
    application?: string | undefined;
    quantity?: string | undefined;
    deliveryAddress?: string | undefined;
    courierTracking?: string | undefined;
    remarks?: string | undefined;
}>;
export declare const createAdminNoteSchema: z.ZodObject<{
    content: z.ZodString;
    companyId: z.ZodOptional<z.ZodString>;
    inquiryId: z.ZodOptional<z.ZodString>;
    quoteRequestId: z.ZodOptional<z.ZodString>;
    sampleRequestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    companyId?: string | undefined;
    inquiryId?: string | undefined;
    quoteRequestId?: string | undefined;
    sampleRequestId?: string | undefined;
}, {
    content: string;
    companyId?: string | undefined;
    inquiryId?: string | undefined;
    quoteRequestId?: string | undefined;
    sampleRequestId?: string | undefined;
}>;
export declare const createFollowUpTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodString;
    assignedToId: z.ZodString;
    companyId: z.ZodOptional<z.ZodString>;
    inquiryId: z.ZodOptional<z.ZodString>;
    quoteRequestId: z.ZodOptional<z.ZodString>;
    sampleRequestId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    assignedToId: string;
    title: string;
    dueDate: string;
    companyId?: string | undefined;
    inquiryId?: string | undefined;
    quoteRequestId?: string | undefined;
    sampleRequestId?: string | undefined;
    description?: string | undefined;
}, {
    assignedToId: string;
    title: string;
    dueDate: string;
    companyId?: string | undefined;
    inquiryId?: string | undefined;
    quoteRequestId?: string | undefined;
    sampleRequestId?: string | undefined;
    description?: string | undefined;
}>;
export declare const updateFollowUpTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "COMPLETED", "MISSED", "CANCELLED"]>>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "PENDING" | "COMPLETED" | "MISSED" | "CANCELLED" | undefined;
    assignedToId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
}, {
    status?: "PENDING" | "COMPLETED" | "MISSED" | "CANCELLED" | undefined;
    assignedToId?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
}>;
export declare const createDocumentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fileUrl: z.ZodString;
    fileType: z.ZodOptional<z.ZodString>;
    fileSize: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodEnum<["BROCHURE", "TECHNICAL_DATASHEET", "SUSTAINABILITY_REPORT", "CASE_STUDY", "CLIENT_DOCUMENT", "INTERNAL"]>>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    companyId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    fileUrl: string;
    companyId?: string | undefined;
    description?: string | undefined;
    fileType?: string | undefined;
    fileSize?: number | undefined;
    category?: "BROCHURE" | "TECHNICAL_DATASHEET" | "SUSTAINABILITY_REPORT" | "CASE_STUDY" | "CLIENT_DOCUMENT" | "INTERNAL" | undefined;
    isPublic?: boolean | undefined;
}, {
    title: string;
    fileUrl: string;
    companyId?: string | undefined;
    description?: string | undefined;
    fileType?: string | undefined;
    fileSize?: number | undefined;
    category?: "BROCHURE" | "TECHNICAL_DATASHEET" | "SUSTAINABILITY_REPORT" | "CASE_STUDY" | "CLIENT_DOCUMENT" | "INTERNAL" | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const updateWebsiteSettingSchema: z.ZodObject<{
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value: string;
}, {
    value: string;
}>;
export declare const updateBrandLogoSchema: z.ZodObject<{
    value: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    value: string;
}, {
    value: string;
}>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "VIEWER"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "SALES" | "OPERATIONS" | "VIEWER";
    password: string;
}, {
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN" | "SALES" | "OPERATIONS" | "VIEWER";
    password: string;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "VIEWER"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    role?: "SUPER_ADMIN" | "ADMIN" | "SALES" | "OPERATIONS" | "VIEWER" | undefined;
    isActive?: boolean | undefined;
    password?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    role?: "SUPER_ADMIN" | "ADMIN" | "SALES" | "OPERATIONS" | "VIEWER" | undefined;
    isActive?: boolean | undefined;
    password?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    search?: string | undefined;
    status?: string | undefined;
    priority?: string | undefined;
}, {
    search?: string | undefined;
    status?: string | undefined;
    priority?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
//# sourceMappingURL=admin.validator.d.ts.map