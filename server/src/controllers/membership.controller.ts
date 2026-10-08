import { Request, Response } from "express";

import {
  createMembership,
  getMembershipById,
  listMemberships,
  updateMembership,
} from "../services/membership.service.js";

const getGymId = (req: Request): string | null => {
  return req.gymId ?? null;
};

const getMembershipId = (req: Request): string | null => {
  const { membershipId } = req.params;

  return typeof membershipId === "string" ? membershipId : null;
};

export const createMembershipController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    const membership = await createMembership(gymId, req.body);

    res.status(201).json({
      success: true,
      message: "Membership created successfully",
      data: {
        membership,
      },
    });
  } catch (error) {
    console.error("Create membership error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to create membership";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const listMembershipsController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    const memberId =
      typeof req.query.memberId === "string" ? req.query.memberId : undefined;

    const result = await listMemberships(gymId, memberId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("List memberships error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to load memberships";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const getMembershipController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const membershipId = getMembershipId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    if (!membershipId) {
      res.status(400).json({
        success: false,
        message: "Invalid membership ID",
      });

      return;
    }

    const membership = await getMembershipById(gymId, membershipId);

    res.status(200).json({
      success: true,
      data: {
        membership,
      },
    });
  } catch (error) {
    console.error("Get membership error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to load membership";

    res.status(404).json({
      success: false,
      message,
    });
  }
};

export const updateMembershipController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const membershipId = getMembershipId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    if (!membershipId) {
      res.status(400).json({
        success: false,
        message: "Invalid membership ID",
      });

      return;
    }

    const membership = await updateMembership(gymId, membershipId, req.body);

    res.status(200).json({
      success: true,
      message: "Membership updated successfully",
      data: {
        membership,
      },
    });
  } catch (error) {
    console.error("Update membership error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to update membership";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
