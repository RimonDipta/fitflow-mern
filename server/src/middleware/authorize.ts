import { NextFunction, Request, Response } from "express";

import { UserRole } from "../models/User.js";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    /*
     * SUPER_ADMIN has global access across FitFlow.
     *
     * This means we do not need to add SUPER_ADMIN
     * to every authorize(...) call throughout the application.
     */
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();

      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });

      return;
    }

    next();
  };
};
