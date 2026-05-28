import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error("Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD in .env before seeding.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✓ Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  // Seed some default website settings
  await prisma.websiteSetting.createMany({
    data: [
      { key: "company_name", value: "White Dot LLP", type: "TEXT", description: "Company display name" },
      { key: "company_email", value: "rajbhanderi107@gmail.com", type: "EMAIL", description: "Primary contact email" },
      { key: "company_phone", value: "+918849728938", type: "TEXT", description: "Primary contact phone" },
      { key: "whatsapp_number", value: "918849728938", type: "TEXT", description: "WhatsApp number (without +)" },
      { key: "company_address", value: "Gujarat, India", type: "TEXT", description: "Company address" },
      { key: "gst_number", value: "", type: "TEXT", description: "GST registration number" },
    ],
    skipDuplicates: true,
  });

  console.log(`✓ Seeded admin user: ${admin.email} (${admin.role})`);
  console.log("✓ Seeded default website settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
