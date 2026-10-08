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

const calculateEndDate = (startDate: Date, durationDays: number): Date => {
  const endDate = new Date(startDate);

  endDate.setDate(endDate.getDate() + durationDays - 1);

  return endDate;
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

  return {
    membership,
    member,
    plan,
  };
};

export const createMembership = async (
  gymId: string,
  input: CreateMembershipInput,
): Promise<MembershipResult> => {
  validateObjectId(gymId, "Invalid gym ID");

  validateObjectId(input.memberId, "Invalid member ID");

  validateObjectId(input.membershipPlanId, "Invalid membership plan ID");

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

  const endDate = calculateEndDate(startDate, plan.durationDays);

  const existingActiveMembership = await Membership.findOne({
    gymId,
    memberId: member._id,
    status: MembershipStatus.ACTIVE,
    endDate: {
      $gte: startDate,
    },
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
    startDate,
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

  const filter: {
    gymId: string;
    memberId?: string;
  } = {
    gymId,
  };

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

  return {
    memberships: results,
    total: results.length,
  };
};

export const getMembershipById = async (
  gymId: string,
  membershipId: string,
): Promise<MembershipResult> => {
  validateObjectId(gymId, "Invalid gym ID");

  validateObjectId(membershipId, "Invalid membership ID");

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

  const updateData = {
    ...(input.paymentStatus !== undefined
      ? {
          paymentStatus: input.paymentStatus as MembershipPaymentStatus,
        }
      : {}),

    ...(input.status !== undefined
      ? {
          status: input.status as MembershipStatus,
        }
      : {}),

    ...(input.notes !== undefined
      ? {
          notes: input.notes || undefined,
        }
      : {}),
  };

  const membership = await Membership.findOneAndUpdate(
    {
      _id: membershipId,
      gymId,
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
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
