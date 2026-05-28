import type { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth middleware after JWT verification */
      currentUser?: {
        id: string;
        email: string;
        name: string;
        role: Role;
      };
    }
  }
}

export {};
