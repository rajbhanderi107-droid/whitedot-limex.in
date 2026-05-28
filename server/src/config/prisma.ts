import { PrismaClient } from "@prisma/client";

// Prevent multiple Prisma instances during hot-reload in development.
// In production there is no hot-reload so this is a no-op safeguard.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
