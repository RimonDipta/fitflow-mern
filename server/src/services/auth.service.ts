import bcrypt from "bcrypt";

import { User, UserRole } from "../models/User.js";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

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

export const registerUser = async (
  input: RegisterUserInput,
): Promise<SafeUser> => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) {
    throw new Error("Name is required");
  }

  if (!email) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: passwordHash,
    role: input.role ?? UserRole.MEMBER,
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
