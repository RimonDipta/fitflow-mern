import type { Request, Response } from "express";

import { getDashboardStats } from "../services/dashboard.service.js";

export const getDashboardStatsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = req.gymId;

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    const stats = await getDashboardStats(gymId);

    res.status(200).json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics",
    });
  }
};
