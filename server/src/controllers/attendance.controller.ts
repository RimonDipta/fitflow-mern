import { Request, Response } from "express";

import {
  checkInMember,
  checkOutMember,
  listAttendance,
} from "../services/attendance.service.js";

interface AttendanceErrorResponse {
  status: number;
  message: string;
}

const getAttendanceErrorResponse = (
  error: unknown,
  operation: "check-in" | "check-out" | "list",
): AttendanceErrorResponse => {
  const message =
    error instanceof Error ? error.message : "Unknown attendance error";

  const badRequestMessages = new Set([
    "Invalid gym ID",
    "Invalid member ID",
    "Invalid user ID",
    "Invalid attendance ID",
    "Date must use YYYY-MM-DD format",
    "Invalid attendance date",
    "Check-out time cannot precede check-in time",
  ]);

  const notFoundMessages = new Set([
    "Member not found in this gym",
    "Attendance session not found",
    "Attendance member could not be found",
  ]);

  const conflictMessages = new Set([
    "Member is already checked in",
    "Only active members can check in",
    "Member does not have a valid active membership today",
    "This attendance session has already been checked out",
  ]);

  if (badRequestMessages.has(message)) {
    return { status: 400, message };
  }

  if (notFoundMessages.has(message)) {
    return { status: 404, message };
  }

  if (conflictMessages.has(message)) {
    return { status: 409, message };
  }

  console.error(`Attendance ${operation} operation failed:`, error);

  return {
    status: 500,
    message:
      operation === "check-in"
        ? "Unable to check in member"
        : operation === "check-out"
          ? "Unable to check out member"
          : "Unable to load attendance",
  };
};

export const checkInController = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

  try {
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
    const result = getAttendanceErrorResponse(error, "check-in");

    res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }
};

export const checkOutController = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

  try {
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
    const result = getAttendanceErrorResponse(error, "check-out");

    res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }
};

export const listAttendanceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!req.gymId) {
    res.status(403).json({
      success: false,
      message: "Your account is not associated with a gym",
    });
    return;
  }

  const date = typeof req.query.date === "string" ? req.query.date : undefined;

  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;

  try {
    const result = await listAttendance(req.gymId, date, search);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const result = getAttendanceErrorResponse(error, "list");

    res.status(result.status).json({
      success: false,
      message: result.message,
    });
  }
};
