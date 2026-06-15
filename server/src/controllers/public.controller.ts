import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { notifyAdmins } from "../services/notification.service.js";
import { sendMail } from "../services/mailer.service.js";

const PUBLIC_LOADING_SETTING = {
  key: "public_loading_enabled",
  value: "false",
  type: "BOOLEAN" as const,
  description: "Show the loading page to public visitors while admins preview and work behind it",
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inquiryEmailText(inquiry: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  companyName?: string | null;
  city?: string | null;
  industry?: string | null;
  inquiryType?: string | null;
  message?: string | null;
  sourcePage?: string | null;
}) {
  return [
    "New WhiteDot LIMEX inquiry",
    "",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    inquiry.phone && `Phone: ${inquiry.phone}`,
    inquiry.companyName && `Company: ${inquiry.companyName}`,
    inquiry.city && `City: ${inquiry.city}`,
    inquiry.industry && `Industry: ${inquiry.industry}`,
    inquiry.inquiryType && `Intent: ${inquiry.inquiryType}`,
    inquiry.sourcePage && `Source: ${inquiry.sourcePage}`,
    "",
    "Message:",
    inquiry.message || "-",
    "",
    `Portal: ${process.env.FRONTEND_URL || "https://whitedotindia.in"}/#/admin/inquiries/${inquiry.id}`,
  ].filter(Boolean).join("\n");
}

export async function submitInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.create({ data: req.body });

  await notifyAdmins(
    "New inquiry",
    `${inquiry.name} (${inquiry.email}) submitted an inquiry.`,
    "LEAD",
  );

  const inbox = process.env.ADMIN_INQUIRY_EMAIL || process.env.SMTP_USER || "office@whitedotindia.in";
  const text = inquiryEmailText(inquiry);
  sendMail({
    to: inbox,
    subject: `New LIMEX inquiry from ${inquiry.name}`,
    text,
    html: `<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;line-height:1.5;">${escapeHtml(text)}</pre>`,
  }).catch((error: unknown) => {
    console.error("[mailer] Inquiry notification failed", error);
  });

  return sendSuccess(res, { id: inquiry.id }, "Inquiry submitted successfully. We will contact you soon.", 201);
}

export async function submitQuoteRequest(req: Request, res: Response) {
  // If companyName is provided in the public form, try linking to existing company
  const companyName = req.body.companyName;
  let companyId: string | undefined;

  if (companyName) {
    const existing = await prisma.company.findFirst({
      where: { companyName: { equals: companyName, mode: "insensitive" } },
      select: { id: true },
    });
    companyId = existing?.id;
  }

  // Remove companyName from data since it's not in the QuoteRequest model
  const { companyName: _cn, ...quoteData } = req.body;

  const quote = await prisma.quoteRequest.create({
    data: { ...quoteData, ...(companyId && { companyId }) },
  });

  await notifyAdmins(
    "New quote request",
    `${quote.contactPerson} (${quote.email}) requested a LIMEX quote.`,
    "QUOTE",
  );

  return sendSuccess(res, { id: quote.id }, "Quote request submitted. Our team will review it.", 201);
}

export async function submitSampleRequest(req: Request, res: Response) {
  const companyName = req.body.companyName;
  let companyId: string | undefined;

  if (companyName) {
    const existing = await prisma.company.findFirst({
      where: { companyName: { equals: companyName, mode: "insensitive" } },
      select: { id: true },
    });
    companyId = existing?.id;
  }

  const { companyName: _cn, ...sampleData } = req.body;

  const sample = await prisma.sampleRequest.create({
    data: { ...sampleData, ...(companyId && { companyId }) },
  });

  await notifyAdmins(
    "New sample request",
    `${sample.contactPerson} (${sample.email}) requested a material sample.`,
    "SAMPLE",
  );

  return sendSuccess(res, { id: sample.id }, "Sample request submitted. We will follow up shortly.", 201);
}

export async function submitCalculatorSubmission(req: Request, res: Response) {
  const submission = await prisma.calculatorSubmission.create({ data: req.body });

  if (req.body.email) {
    await notifyAdmins(
      "Calculator submission",
      `${req.body.contactPerson || "A visitor"} used the LIMEX calculator.`,
      "LEAD",
    );
  }

  return sendSuccess(res, { id: submission.id }, "Calculator results saved.", 201);
}

export async function getWebsiteSettings(_req: Request, res: Response) {
  const settings = await prisma.websiteSetting.findMany({
    select: { key: true, value: true, type: true, updatedAt: true },
    orderBy: { key: "asc" },
  });

  const hasPublicLoading = settings.some((setting) => setting.key === PUBLIC_LOADING_SETTING.key);
  const publicSettings = hasPublicLoading
    ? settings
    : [
        ...settings,
        {
          ...PUBLIC_LOADING_SETTING,
          updatedAt: new Date(0),
        },
      ];

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return sendSuccess(res, publicSettings);
}

export async function getGoogleOverview(_req: Request, res: Response) {
  const setting = await prisma.websiteSetting.findFirst({
    where: { key: "google_overview_data" },
  });
  if (setting && setting.value) {
    try {
      const data = JSON.parse(setting.value);
      return sendSuccess(res, data);
    } catch (e) {
      // JSON parse failed, proceed to fetch fresh
    }
  }

  // Import dynamic/lazy to avoid circular import issues if google.controller imports public.controller
  const { fetchAndStoreGoogleData } = await import("./google.controller.js");
  const data = await fetchAndStoreGoogleData();
  return sendSuccess(res, data);
}
