import { Request, Response } from "express";

import {
  createMember,
  deleteMember,
  getMemberById,
  listMembers,
  updateMember,
  updateMemberStatus,
} from "../services/member.service.js";
import { MemberStatus } from "../models/Member.js";

const getGymId = (req: Request): string | null => {
  if (!req.gymId) {
    return null;
  }

  return req.gymId;
};

const getMemberId = (req: Request): string | null => {
  const { memberId } = req.params;

  if (typeof memberId !== "string") {
    return null;
  }

  return memberId;
};

export const createMemberController = async (
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

    const member = await createMember(gymId, req.body);

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: {
        member,
      },
    });
  } catch (error) {
    console.error("Create member error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to create member";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const listMembersController = async (
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

    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 20;

    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await listMembers(gymId, page, limit, search);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("List members error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to load members";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const getMemberController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const memberId = getMemberId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });
      return;
    }

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
      return;
    }

    const member = await getMemberById(gymId, memberId);

    res.status(200).json({
      success: true,
      data: {
        member,
      },
    });
  } catch (error) {
    console.error("Get member error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to load member";

    res.status(404).json({
      success: false,
      message,
    });
  }
};

export const updateMemberController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const memberId = getMemberId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });
      return;
    }

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
      return;
    }

    const member = await updateMember(gymId, memberId, req.body);

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: {
        member,
      },
    });
  } catch (error) {
    console.error("Update member error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to update member";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const updateMemberStatusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const memberId = getMemberId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });
      return;
    }

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
      return;
    }

    const status = req.body.status as MemberStatus;

    const member = await updateMemberStatus(gymId, memberId, status);

    res.status(200).json({
      success: true,
      message: "Member status updated successfully",
      data: {
        member,
      },
    });
  } catch (error) {
    console.error("Update member status error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to update member status";

    res.status(400).json({
      success: false,
      message,
    });
  }
};

export const deleteMemberController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const gymId = getGymId(req);
    const memberId = getMemberId(req);

    if (!gymId) {
      res.status(403).json({
        success: false,
        message: "Your account is not associated with a gym",
      });
      return;
    }

    if (!memberId) {
      res.status(400).json({
        success: false,
        message: "Invalid member ID",
      });
      return;
    }

    await deleteMember(gymId, memberId);

    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Delete member error:", error);

    const message =
      error instanceof Error ? error.message : "Unable to delete member";

    res.status(404).json({
      success: false,
      message,
    });
  }
};
