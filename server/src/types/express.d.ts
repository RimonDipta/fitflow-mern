import { UserRole } from "../models/User.js";

declare global {
  namespace Express {
    interface AuthenticatedUser {
      userId: string;
      role: UserRole;
      gymId?: string;
    }

    interface Request {
      user?: AuthenticatedUser;
      gymId?: string;
    }
  }
}

export {};
