import { NextFunction, Request, Response } from "express";

import { UserRole } from "../models/User.js";
import { Gym } from "../models/Gym.js";

export const requireGym = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    /*
     * SUPER_ADMIN is a platform-level user.
     *
     * A SUPER_ADMIN can operate without being permanently
     * attached to one specific gym.
     */
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();

      return;
    }

    if (!req.user.gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    const gym = await Gym.findById(req.user.gymId).select("_id isActive");

    if (!gym) {
      res.status(403).json({
        success: false,
        message: "Gym associated with your account was not found",
      });

      return;
    }

    if (!gym.isActive) {
      res.status(403).json({
        success: false,
        message: "This gym is currently inactive",
      });

      return;
    }

    /*
     * Store the verified tenant ID on the request.
     *
     * Future tenant-owned services should use req.gymId
     * instead of trusting a gymId supplied by the client.
     */
    req.gymId = gym._id.toString();

    next();
  } catch (error) {
    console.error("Gym context error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify gym context",
    });
  }
};
