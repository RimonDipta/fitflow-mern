import { Request, Response } from "express";

import { User } from "../models/User.js";

export const getCurrentUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: {
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
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to get current user",
    });
  }
};

export const getAdminAccessCheck = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });

    return;
  }

  res.status(200).json({
    success: true,
    message: "RBAC authorization successful",
    data: {
      userId: req.user.userId,
      role: req.user.role,
      message: "You have administrative access to this resource",
    },
  });
};
