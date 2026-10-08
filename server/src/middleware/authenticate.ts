import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { UserRole } from "../models/User.js";

interface AccessTokenPayload extends jwt.JwtPayload {
  userId: string;
  role: UserRole;
  gymId?: string;
}

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!authorizationHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
      return;
    }

    const accessToken = authorizationHeader.substring(7);

    if (!accessToken) {
      res.status(401).json({
        success: false,
        message: "Access token is required",
      });
      return;
    }

    const decoded = jwt.verify(
      accessToken,
      getAccessSecret(),
    ) as AccessTokenPayload;

    if (!decoded.userId || !decoded.role) {
      res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
      gymId: user.gymId?.toString(),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Access token has expired",
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "Invalid access token",
    });
  }
};
