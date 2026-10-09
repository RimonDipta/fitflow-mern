import { api } from "../../../lib/api";

import type {
  CreateMembershipPayload,
  Membership,
  MembershipListResponse,
  UpdateMembershipPayload,
} from "../types";

export const getMemberships = async (
  memberId?: string,
): Promise<MembershipListResponse> => {
  const response = await api.get("/memberships", {
    params: memberId
      ? {
          memberId,
        }
      : undefined,
  });

  return response.data.data;
};

export const getMembership = async (
  membershipId: string,
): Promise<Membership> => {
  const response = await api.get(`/memberships/${membershipId}`);

  return response.data.data.membership;
};

export const createMembership = async (
  payload: CreateMembershipPayload,
): Promise<Membership> => {
  const response = await api.post("/memberships", payload);

  return response.data.data.membership;
};

export const updateMembership = async (
  membershipId: string,
  payload: UpdateMembershipPayload,
): Promise<Membership> => {
  const response = await api.patch(`/memberships/${membershipId}`, payload);

  return response.data.data.membership;
};
