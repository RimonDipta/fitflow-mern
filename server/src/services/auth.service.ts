import bcrypt from "bcrypt";

import { User, UserRole } from "../models/User.js";
import type { RegisterInput } from "../validators/auth.validator.js";

interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  gymId?: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}

export const registerUser = async (input: RegisterInput): Promise<SafeUser> => {
  const existingUser = await User.findOne({
    email: input.email,
  });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: passwordHash,
    role: UserRole.MEMBER,
  });

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    gymId: user.gymId?.toString(),
    avatar: user.avatar,
    phone: user.phone,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
};
