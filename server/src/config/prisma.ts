import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

// Prevent multiple Prisma instances during hot-reload in development.
// In production there is no hot-reload so this is a no-op safeguard.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isProduction ? ["error"] : ["warn", "error"],
    // Connection pool — tuned for Render free tier (limited connections)
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

if (!env.isProduction) {
  globalForPrisma.prisma = prisma;
}

// ─── Connection health check on startup ─────────
// Eagerly connect so the first API request doesn't pay the connection cost.
prisma.$connect()
  .then(() => console.log("  Prisma connected to database."))
  .catch((err: any) => console.error("  Prisma connection failed:", err.message));
