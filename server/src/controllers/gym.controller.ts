import { Request, Response } from "express";

import { createGymWithAdmin, getCurrentGym } from "../services/gym.service.js";

export const createGym = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await createGymWithAdmin({
      gym: req.body.gym,
      admin: req.body.admin,
    });

    res.status(201).json({
      success: true,
      message: "Gym and gym administrator created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create gym error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to create gym";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const getCurrentGymController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    const gym = await getCurrentGym(req.gymId);

    res.status(200).json({
      success: true,
      data: {
        gym,
      },
    });
  } catch (error) {
    console.error("Get current gym error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to get current gym";

    res.status(404).json({
      success: false,
      message,
    });
  }
};
