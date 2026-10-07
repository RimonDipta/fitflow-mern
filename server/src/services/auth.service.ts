import bcrypt from "bcrypt";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../config/jwt.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { User, UserRole } from "../models/User.js";
import type {
  LoginInput,
  RegisterInput,
} from "../validators/auth.validator.js";
import { hashToken } from "../utils/token.js";

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

interface RefreshResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

const toSafeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  gymId?: { toString(): string };
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}): SafeUser => {
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

const createRefreshSession = async (
  userId: string,
  refreshToken: string,
): Promise<void> => {
  const decoded = verifyRefreshToken(refreshToken);

  if (!decoded.exp) {
    throw new Error("Refresh token expiration is missing");
  }

  await RefreshSession.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
  });
};

const createAuthResult = async (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  gymId?: { toString(): string };
  avatar?: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
}): Promise<AuthResult> => {
  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    ...(user.gymId
      ? {
          gymId: user.gymId.toString(),
        }
      : {}),
  };

  const accessToken = generateAccessToken(tokenPayload);

  const refreshToken = generateRefreshToken(tokenPayload);

  await createRefreshSession(user._id.toString(), refreshToken);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
  };
};

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

  return toSafeUser(user);
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

  return createAuthResult(user);
};

export const refreshUserSession = async (
  refreshToken: string,
): Promise<RefreshResult> => {
  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  if (!decoded.userId) {
    throw new Error("Invalid refresh token");
  }

  const tokenHash = hashToken(refreshToken);

  const session = await RefreshSession.findOne({
    tokenHash,
  });

  /*
   * If the token is no longer in the database, it cannot
   * be used to create a new session.
   */
  if (!session) {
    throw new Error("Refresh session not found");
  }

  /*
   * Reusing a revoked refresh token is a strong indication
   * that an old token has been stolen.
   *
   * Revoke all sessions belonging to the user.
   */
  if (session.revokedAt) {
    await RefreshSession.updateMany(
      {
        userId: session.userId,
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );

    throw new Error(
      "Refresh token reuse detected. All sessions have been revoked.",
    );
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await RefreshSession.updateOne(
      { _id: session._id },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );

    throw new Error("Refresh token has expired");
  }

  if (session.userId.toString() !== decoded.userId) {
    throw new Error("Invalid refresh session");
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    await RefreshSession.updateOne(
      { _id: session._id },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );

    throw new Error("User account no longer exists");
  }

  if (!user.isActive) {
    await RefreshSession.updateOne(
      { _id: session._id },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
    );

    throw new Error("Your account has been deactivated");
  }

  /*
   * Revoke the old refresh session before creating
   * the replacement session.
   */
  session.revokedAt = new Date();

  await session.save();

  const tokenPayload = {
    userId: user._id.toString(),
    role: user.role,
    ...(user.gymId
      ? {
          gymId: user.gymId.toString(),
        }
      : {}),
  };

  const accessToken = generateAccessToken(tokenPayload);

  const newRefreshToken = generateRefreshToken(tokenPayload);

  await createRefreshSession(user._id.toString(), newRefreshToken);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);

  await RefreshSession.updateOne(
    {
      tokenHash,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};
