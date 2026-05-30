import { z } from "zod";

// ─── Company ─────────────────────────────────────
export const createCompanySchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(300),
  industry: z.string().max(200).optional(),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  address: z.string().max(1000).optional(),
  gstNumber: z.string().max(50).optional(),
  status: z.enum(["LEAD", "ACTIVE_CLIENT", "INACTIVE", "BLACKLISTED"]).optional(),
  notes: z.string().max(5000).optional(),
}).strip();

export const updateCompanySchema = createCompanySchema.partial();

// ─── Inquiry ─────────────────────────────────────
export const updateInquirySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  companyName: z.string().max(200).optional(),
  designation: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  industry: z.string().max(200).optional(),
  inquiryType: z.string().max(100).optional(),
  message: z.string().max(5000).optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST", "ARCHIVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  internalNotes: z.string().max(5000).optional(),
  followUpDate: z.string().datetime().optional().nullable(),
}).strip();

// ─── Quote Request ───────────────────────────────
export const updateQuoteRequestSchema = z.object({
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
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
  status: z.enum(["NEW", "UNDER_REVIEW", "NEED_MORE_INFO", "QUOTED", "NEGOTIATION", "APPROVED", "REJECTED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
}).strip();

// ─── Sample Request ──────────────────────────────
export const updateSampleRequestSchema = z.object({
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  requestedMaterialType: z.string().max(200).optional(),
  application: z.string().max(500).optional(),
  quantity: z.string().max(100).optional(),
  deliveryAddress: z.string().max(1000).optional(),
  courierTracking: z.string().max(200).optional(),
  status: z.enum(["REQUESTED", "APPROVED", "REJECTED", "DISPATCHED", "DELIVERED", "CANCELLED"]).optional(),
  remarks: z.string().max(2000).optional(),
  companyId: z.string().optional().nullable(),
}).strip();

// ─── Admin Note ──────────────────────────────────
export const createAdminNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
  companyId: z.string().optional(),
  inquiryId: z.string().optional(),
  quoteRequestId: z.string().optional(),
  sampleRequestId: z.string().optional(),
}).strip();

// ─── Follow-Up Task ──────────────────────────────
export const createFollowUpTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime("Valid date is required"),
  assignedToId: z.string().min(1, "Assignee is required"),
  companyId: z.string().optional(),
  inquiryId: z.string().optional(),
  quoteRequestId: z.string().optional(),
  sampleRequestId: z.string().optional(),
}).strip();

export const updateFollowUpTaskSchema = z.object({
  title: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(["PENDING", "COMPLETED", "MISSED", "CANCELLED"]).optional(),
  assignedToId: z.string().optional(),
}).strip();

// ─── Document ────────────────────────────────────
export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().max(2000).optional(),
  fileUrl: z.string().url("Valid URL is required"),
  fileType: z.string().max(50).optional(),
  fileSize: z.number().int().optional(),
  category: z.enum(["BROCHURE", "TECHNICAL_DATASHEET", "SUSTAINABILITY_REPORT", "CASE_STUDY", "CLIENT_DOCUMENT", "INTERNAL"]).optional(),
  isPublic: z.boolean().optional(),
  companyId: z.string().optional(),
}).strip();

// ─── Website Setting ─────────────────────────────
export const updateWebsiteSettingSchema = z.object({
  value: z.string().max(5000),
}).strip();

// Logo can be an uploaded image (base64 data URL) or an http(s) URL, or "" to reset.
export const updateBrandLogoSchema = z.object({
  value: z
    .string()
    .max(1_500_000)
    .refine(
      (v) =>
        v === "" ||
        /^data:image\/(png|jpeg|jpg|webp|svg\+xml|gif|x-icon|vnd\.microsoft\.icon);base64,/.test(v) ||
        /^https?:\/\//.test(v),
      "Logo must be an uploaded image or an http(s) URL",
    ),
}).strip();

// ─── User Management ─────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "VIEWER"]),
}).strip();

export const updateUserSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "VIEWER"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
}).strip();

// ─── Pagination / Query ──────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  sortBy: z.string().max(50).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
