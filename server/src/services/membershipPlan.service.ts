import { Types } from "mongoose";

import {
  MembershipPlan,
  MembershipPlanStatus,
} from "../models/MembershipPlan.js";

import type {
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
} from "../validators/membershipPlan.validator.js";

interface MembershipPlanResult {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  status: MembershipPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface MembershipPlanListResult {
  plans: MembershipPlanResult[];
  total: number;
}

const toMembershipPlanResult = (plan: {
  _id: Types.ObjectId;
  gymId: Types.ObjectId;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  status: MembershipPlanStatus;
  createdAt: Date;
  updatedAt: Date;
}): MembershipPlanResult => ({
  id: plan._id.toString(),
  gymId: plan.gymId.toString(),
  name: plan.name,
  description: plan.description,
  durationDays: plan.durationDays,
  price: plan.price,
  status: plan.status,
  createdAt: plan.createdAt,
  updatedAt: plan.updatedAt,
});

const validateGymId = (gymId: string): void => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }
};

const validatePlanId = (planId: string): void => {
  if (!Types.ObjectId.isValid(planId)) {
    throw new Error("Invalid membership plan ID");
  }
};

export const createMembershipPlan = async (
  gymId: string,
  input: CreateMembershipPlanInput,
): Promise<MembershipPlanResult> => {
  validateGymId(gymId);

  const existingPlan = await MembershipPlan.findOne({
    gymId,
    name: input.name,
  });

  if (existingPlan) {
    throw new Error("A membership plan with this name already exists");
  }

  const plan = await MembershipPlan.create({
    gymId,
    name: input.name,
    description: input.description || undefined,
    durationDays: input.durationDays,
    price: input.price,
    status: MembershipPlanStatus.ACTIVE,
  });

  return toMembershipPlanResult(plan);
};

export const listMembershipPlans = async (
  gymId: string,
  includeInactive = false,
): Promise<MembershipPlanListResult> => {
  validateGymId(gymId);

  const filter: {
    gymId: string;
    status?: MembershipPlanStatus;
  } = {
    gymId,
  };

  if (!includeInactive) {
    filter.status = MembershipPlanStatus.ACTIVE;
  }

  const [plans, total] = await Promise.all([
    MembershipPlan.find(filter).sort({
      createdAt: -1,
    }),

    MembershipPlan.countDocuments(filter),
  ]);

  return {
    plans: plans.map(toMembershipPlanResult),
    total,
  };
};

export const getMembershipPlanById = async (
  gymId: string,
  planId: string,
): Promise<MembershipPlanResult> => {
  validateGymId(gymId);
  validatePlanId(planId);

  const plan = await MembershipPlan.findOne({
    _id: planId,
    gymId,
  });

  if (!plan) {
    throw new Error("Membership plan not found");
  }

  return toMembershipPlanResult(plan);
};

export const updateMembershipPlan = async (
  gymId: string,
  planId: string,
  input: UpdateMembershipPlanInput,
): Promise<MembershipPlanResult> => {
  validateGymId(gymId);
  validatePlanId(planId);

  if (input.name !== undefined) {
    const duplicatePlan = await MembershipPlan.findOne({
      _id: { $ne: planId },
      gymId,
      name: input.name,
    });

    if (duplicatePlan) {
      throw new Error("A membership plan with this name already exists");
    }
  }

  const updateData = {
    ...(input.name !== undefined ? { name: input.name } : {}),

    ...(input.description !== undefined
      ? {
          description: input.description || undefined,
        }
      : {}),

    ...(input.durationDays !== undefined
      ? {
          durationDays: input.durationDays,
        }
      : {}),

    ...(input.price !== undefined ? { price: input.price } : {}),
  };

  const plan = await MembershipPlan.findOneAndUpdate(
    {
      _id: planId,
      gymId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!plan) {
    throw new Error("Membership plan not found");
  }

  return toMembershipPlanResult(plan);
};

export const updateMembershipPlanStatus = async (
  gymId: string,
  planId: string,
  status: MembershipPlanStatus,
): Promise<MembershipPlanResult> => {
  validateGymId(gymId);
  validatePlanId(planId);

  const plan = await MembershipPlan.findOneAndUpdate(
    {
      _id: planId,
      gymId,
    },
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!plan) {
    throw new Error("Membership plan not found");
  }

  return toMembershipPlanResult(plan);
};
