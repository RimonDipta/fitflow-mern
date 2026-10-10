import { Request, Response } from "express";

import {
  checkInMember,
  checkOutMember,
  listAttendance,
} from "../services/attendance.service.js";

export const checkInController = async (
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

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const attendance = await checkInMember(
      req.gymId,
      req.body.memberId,
      req.user.userId,
    );

    res.status(201).json({
      success: true,
      message: "Member checked in successfully",
      data: { attendance },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check in member";

    const status = message === "Member not found in this gym" ? 404 : 400;

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const checkOutController = async (
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

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { attendanceId } = req.params;

    if (typeof attendanceId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
      return;
    }

    const attendance = await checkOutMember(
      req.gymId,
      attendanceId,
      req.user.userId,
    );

    res.status(200).json({
      success: true,
      message: "Member checked out successfully",
      data: { attendance },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to check out member";

    const status = message === "Open attendance session not found" ? 404 : 400;

    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const listAttendanceController = async (
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

    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await listAttendance(req.gymId, date, search);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load attendance";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
