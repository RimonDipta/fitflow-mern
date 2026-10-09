import { Types } from "mongoose";

import {
  Membership,
  MembershipPaymentStatus,
  MembershipStatus,
} from "../models/Membership.js";

import {
  MembershipPlan,
  MembershipPlanStatus,
} from "../models/MembershipPlan.js";

import { Member } from "../models/Member.js";

import type {
  CreateMembershipInput,
  UpdateMembershipInput,
} from "../validators/membership.validator.js";

interface MembershipResult {
  id: string;
  gymId: string;
  memberId: string;
  membershipPlanId: string;
  member: {
    id: string;
    name: string;
    memberCode: string;
  };
  plan: {
    id: string;
    name: string;
    durationDays: number;
  };
  startDate: Date;
  endDate: Date;
  price: number;
  paymentStatus: MembershipPaymentStatus;
  status: MembershipStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MembershipListResult {
  memberships: MembershipResult[];
  total: number;
}

const validateObjectId = (value: string, message: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(message);
  }
};

const getStartOfUtcDay = (date: Date = new Date()): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

const getEndOfUtcDay = (date: Date): Date =>
  new Date(getStartOfUtcDay(date).getTime() + 86_400_000 - 1);

const calculateEndDate = (startDate: Date, durationDays: number): Date => {
  const endDate = getStartOfUtcDay(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + durationDays - 1);
  return getEndOfUtcDay(endDate);
};

const expireMembershipsForGym = async (gymId: string): Promise<void> => {
  await Membership.updateMany(
    {
      gymId,
      status: MembershipStatus.ACTIVE,
      endDate: { $lt: getStartOfUtcDay() },
    },
    { $set: { status: MembershipStatus.EXPIRED } },
  );
};

const toMembershipResult = (
  membership: {
    _id: Types.ObjectId;
    gymId: Types.ObjectId;
    memberId: Types.ObjectId;
    membershipPlanId: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    price: number;
    paymentStatus: MembershipPaymentStatus;
    status: MembershipStatus;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  },
  member: {
    _id: Types.ObjectId;
    name: string;
    memberCode: string;
  },
  plan: {
    _id: Types.ObjectId;
    name: string;
    durationDays: number;
  },
): MembershipResult => ({
  id: membership._id.toString(),
  gymId: membership.gymId.toString(),
  memberId: membership.memberId.toString(),
  membershipPlanId: membership.membershipPlanId.toString(),
  member: {
    id: member._id.toString(),
    name: member.name,
    memberCode: member.memberCode,
  },
  plan: {
    id: plan._id.toString(),
    name: plan.name,
    durationDays: plan.durationDays,
  },
  startDate: membership.startDate,
  endDate: membership.endDate,
  price: membership.price,
  paymentStatus: membership.paymentStatus,
  status: membership.status,
  notes: membership.notes,
  createdAt: membership.createdAt,
  updatedAt: membership.updatedAt,
});

const findMembershipWithRelations = async (
  gymId: string,
  membershipId: string,
) => {
  const membership = await Membership.findOne({
    _id: membershipId,
    gymId,
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  const member = await Member.findOne({
    _id: membership.memberId,
    gymId,
  });

  const plan = await MembershipPlan.findOne({
    _id: membership.membershipPlanId,
    gymId,
  });

  if (!member) {
    throw new Error("Membership member could not be found");
  }

  if (!plan) {
    throw new Error("Membership plan could not be found");
  }

  return { membership, member, plan };
};

export const createMembership = async (
  gymId: string,
  input: CreateMembershipInput,
): Promise<MembershipResult> => {
  validateObjectId(gymId, "Invalid gym ID");
  validateObjectId(input.memberId, "Invalid member ID");
  validateObjectId(input.membershipPlanId, "Invalid membership plan ID");

  await expireMembershipsForGym(gymId);

  const member = await Member.findOne({
    _id: input.memberId,
    gymId,
  });

  if (!member) {
    throw new Error("Member not found");
  }

  const plan = await MembershipPlan.findOne({
    _id: input.membershipPlanId,
    gymId,
    status: MembershipPlanStatus.ACTIVE,
  });

  if (!plan) {
    throw new Error("Active membership plan not found");
  }

  const startDate = new Date(input.startDate);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid membership start date");
  }

  const normalizedStartDate = getStartOfUtcDay(startDate);

  if (normalizedStartDate < getStartOfUtcDay()) {
    throw new Error("Membership start date cannot be in the past");
  }

  const endDate = calculateEndDate(normalizedStartDate, plan.durationDays);

  const existingActiveMembership = await Membership.findOne({
    gymId,
    memberId: member._id,
    status: MembershipStatus.ACTIVE,
    startDate: { $lte: endDate },
    endDate: { $gte: normalizedStartDate },
  });

  if (existingActiveMembership) {
    throw new Error(
      "Member already has an active membership covering this period",
    );
  }

  const paymentStatus = input.paymentStatus
    ? (input.paymentStatus as MembershipPaymentStatus)
    : MembershipPaymentStatus.PENDING;

  const membership = await Membership.create({
    gymId,
    memberId: member._id,
    membershipPlanId: plan._id,
    startDate: normalizedStartDate,
    endDate,
    price: plan.price,
    paymentStatus,
    status: MembershipStatus.ACTIVE,
    notes: input.notes || undefined,
  });

  return toMembershipResult(membership, member, plan);
};

export const listMemberships = async (
  gymId: string,
  memberId?: string,
): Promise<MembershipListResult> => {
  validateObjectId(gymId, "Invalid gym ID");

  if (memberId) {
    validateObjectId(memberId, "Invalid member ID");
  }

  await expireMembershipsForGym(gymId);

  const filter: { gymId: string; memberId?: string } = { gymId };

  if (memberId) {
    filter.memberId = memberId;
  }

  const memberships = await Membership.find(filter).sort({
    startDate: -1,
    createdAt: -1,
  });

  const results: MembershipResult[] = [];

  for (const membership of memberships) {
    const member = await Member.findOne({
      _id: membership.memberId,
      gymId,
    });

    const plan = await MembershipPlan.findOne({
      _id: membership.membershipPlanId,
      gymId,
    });

    if (!member || !plan) {
      continue;
    }

    results.push(toMembershipResult(membership, member, plan));
  }

  return { memberships: results, total: results.length };
};

export const getMembershipById = async (
  gymId: string,
  membershipId: string,
): Promise<MembershipResult> => {
  validateObjectId(gymId, "Invalid gym ID");
  validateObjectId(membershipId, "Invalid membership ID");

  await expireMembershipsForGym(gymId);

  const { membership, member, plan } = await findMembershipWithRelations(
    gymId,
    membershipId,
  );

  return toMembershipResult(membership, member, plan);
};

export const updateMembership = async (
  gymId: string,
  membershipId: string,
  input: UpdateMembershipInput,
): Promise<MembershipResult> => {
  validateObjectId(gymId, "Invalid gym ID");
  validateObjectId(membershipId, "Invalid membership ID");

  await expireMembershipsForGym(gymId);

  const existingMembership = await Membership.findOne({
    _id: membershipId,
    gymId,
  });

  if (!existingMembership) {
    throw new Error("Membership not found");
  }

  if (input.status === MembershipStatus.ACTIVE) {
    const today = getStartOfUtcDay();

    if (existingMembership.endDate < today) {
      throw new Error(
        "An expired membership cannot be reactivated. Create a new membership instead.",
      );
    }

    const overlappingMembership = await Membership.findOne({
      _id: { $ne: existingMembership._id },
      gymId,
      memberId: existingMembership.memberId,
      status: MembershipStatus.ACTIVE,
      startDate: { $lte: existingMembership.endDate },
      endDate: { $gte: existingMembership.startDate },
    });

    if (overlappingMembership) {
      throw new Error("This membership overlaps another active membership");
    }
  }

  const updateData = {
    ...(input.paymentStatus !== undefined
      ? {
          paymentStatus: input.paymentStatus as MembershipPaymentStatus,
        }
      : {}),
    ...(input.status !== undefined
      ? { status: input.status as MembershipStatus }
      : {}),
    ...(input.notes !== undefined ? { notes: input.notes || undefined } : {}),
  };

  const membership = await Membership.findOneAndUpdate(
    { _id: membershipId, gymId },
    updateData,
    { new: true, runValidators: true },
  );

  if (!membership) {
    throw new Error("Membership not found");
  }

  const { member, plan } = await findMembershipWithRelations(
    gymId,
    membershipId,
  );

  return toMembershipResult(membership, member, plan);
};
