import { Request, Response } from "express";

import {
  createMembershipPlan,
  getMembershipPlanById,
  listMembershipPlans,
  updateMembershipPlan,
  updateMembershipPlanStatus,
} from "../services/membershipPlan.service.js";

import { MembershipPlanStatus } from "../models/MembershipPlan.js";

const getGymId = (req: Request): string | null => {
  if (!req.gymId) {
    return null;
  }

  return req.gymId;
};

const getPlanId = (req: Request): string | null => {
  const { planId } = req.params;

  if (typeof planId !== "string") {
    return null;
  }

  return planId;
};

export const createMembershipPlanController = async (
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

    const plan = await createMembershipPlan(gymId, req.body);

    res.status(201).json({
      success: true,
      message: "Membership plan created successfully",
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error("Create membership plan error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create membership plan";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const listMembershipPlansController = async (
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

    const includeInactive = req.query.includeInactive === "true";

    const result = await listMembershipPlans(gymId, includeInactive);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("List membership plans error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load membership plans";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const getMembershipPlanController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const planId = getPlanId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    if (!planId) {
      res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });

      return;
    }

    const plan = await getMembershipPlanById(gymId, planId);

    res.status(200).json({
      success: true,
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error("Get membership plan error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to load membership plan";

    res.status(404).json({
      success: false,
      message,
    });
  }
};

export const updateMembershipPlanController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const planId = getPlanId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    if (!planId) {
      res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });

      return;
    }

    const plan = await updateMembershipPlan(gymId, planId, req.body);

    res.status(200).json({
      success: true,
      message: "Membership plan updated successfully",
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error("Update membership plan error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update membership plan";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const updateMembershipPlanStatusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const planId = getPlanId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });

      return;
    }

    if (!planId) {
      res.status(400).json({
        success: false,
        message: "Invalid membership plan ID",
      });

      return;
    }

    const status = req.body.status as MembershipPlanStatus;

    const plan = await updateMembershipPlanStatus(gymId, planId, status);

    res.status(200).json({
      success: true,
      message: "Membership plan status updated successfully",
      data: {
        plan,
      },
    });
  } catch (error) {
    console.error("Update membership plan status error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update membership plan status";

    res.status(400).json({
      success: false,
      message,
    });
  }
};
