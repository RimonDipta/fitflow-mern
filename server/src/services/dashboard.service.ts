import { Types } from "mongoose";

import { Member } from "../models/Member.js";
import {
  Membership,
  MembershipPaymentStatus,
  MembershipStatus,
} from "../models/Membership.js";

export interface DashboardStats {
  totalMembers: number;
  activeMemberships: number;
  expiredMemberships: number;
  cancelledMemberships: number;
  pendingPayments: number;
  partialPayments: number;
  expiringWithin7Days: number;
}

export const getDashboardStats = async (
  gymId: string,
): Promise<DashboardStats> => {
  if (!Types.ObjectId.isValid(gymId)) {
    throw new Error("Invalid gym ID");
  }

  const gymObjectId = new Types.ObjectId(gymId);

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalMembers,
    activeMemberships,
    expiredMemberships,
    cancelledMemberships,
    pendingPayments,
    partialPayments,
    expiringWithin7Days,
  ] = await Promise.all([
    Member.countDocuments({
      gymId: gymObjectId,
    }),

    Membership.countDocuments({
      gymId: gymObjectId,
      status: MembershipStatus.ACTIVE,
    }),

    Membership.countDocuments({
      gymId: gymObjectId,
      status: MembershipStatus.EXPIRED,
    }),

    Membership.countDocuments({
      gymId: gymObjectId,
      status: MembershipStatus.CANCELLED,
    }),

    Membership.countDocuments({
      gymId: gymObjectId,
      paymentStatus: MembershipPaymentStatus.PENDING,
    }),

    Membership.countDocuments({
      gymId: gymObjectId,
      paymentStatus: MembershipPaymentStatus.PARTIAL,
    }),

    Membership.countDocuments({
      gymId: gymObjectId,
      status: MembershipStatus.ACTIVE,
      endDate: {
        $gte: now,
        $lte: sevenDaysFromNow,
      },
    }),
  ]);

  return {
    totalMembers,
    activeMemberships,
    expiredMemberships,
    cancelledMemberships,
    pendingPayments,
    partialPayments,
    expiringWithin7Days,
  };
};
