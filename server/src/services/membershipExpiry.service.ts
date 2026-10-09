import { Membership, MembershipStatus } from "../models/Membership.js";

/**
 * Expires every active membership whose end date is before
 * the beginning of the current UTC day.
 *
 * This is an internal maintenance operation. It intentionally
 * covers all gyms and does not expose membership data through
 * a tenant-facing API.
 */
export const expireOverdueMemberships = async (): Promise<number> => {
  const now = new Date();

  const startOfUtcDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const result = await Membership.updateMany(
    {
      status: MembershipStatus.ACTIVE,
      endDate: { $lt: startOfUtcDay },
    },
    {
      $set: {
        status: MembershipStatus.EXPIRED,
      },
    },
  );

  return result.modifiedCount;
};
