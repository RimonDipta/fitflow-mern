import { Request, Response } from "express";

import { loginUser, registerUser } from "../services/auth.service.js";

const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await loginUser({
      email: req.body.email,
      password: req.body.password,
    });

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
      path: "/api/v1/auth",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to login";

    res.status(401).json({
      success: false,
      message,
    });
  }
};
