import bcrypt from "bcrypt";

import { generateAccessToken, generateRefreshToken } from "../config/jwt.js";
import { User, UserRole } from "../models/User.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator.js";

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

interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
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

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({
    email: input.email,
  }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Your account has been deactivated");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  user.lastLoginAt = new Date();

  await user.save();

  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    ...(user.gymId ? { gymId: user.gymId.toString() } : {}),
  };

  const accessToken = generateAccessToken(tokenPayload);

  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
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
    },
    accessToken,
    refreshToken,
  };
};
