import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { notifyAdmins } from "../services/notification.service.js";

const PUBLIC_LOADING_SETTING = {
  key: "public_loading_enabled",
  value: "true",
  type: "BOOLEAN" as const,
  description: "Show the loading page to public visitors while admins preview and work behind it",
};

async function ensurePublicLoadingSetting() {
  await prisma.websiteSetting.upsert({
    where: { key: PUBLIC_LOADING_SETTING.key },
    update: {},
    create: PUBLIC_LOADING_SETTING,
  });
}

export async function submitInquiry(req: Request, res: Response) {
  const inquiry = await prisma.inquiry.create({ data: req.body });

  await notifyAdmins(
    "New inquiry",
    `${inquiry.name} (${inquiry.email}) submitted an inquiry.`,
    "LEAD",
  );

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
  await ensurePublicLoadingSetting();

  const settings = await prisma.websiteSetting.findMany({
    select: { key: true, value: true, type: true, updatedAt: true },
    orderBy: { key: "asc" },
  });

  return sendSuccess(res, settings);
}
