import { Request, Response } from "express";

import { createGymWithAdmin } from "../services/gym.service.js";

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
