import { Request, Response } from "express";

import { registerUser } from "../services/auth.service.js";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await registerUser({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register user";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
