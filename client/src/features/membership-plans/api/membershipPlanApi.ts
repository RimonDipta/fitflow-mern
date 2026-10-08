import { api } from "../../../lib/api";

import type {
  CreateMembershipPlanPayload,
  MembershipPlan,
  MembershipPlanListResponse,
  UpdateMembershipPlanPayload,
  UpdateMembershipPlanStatusPayload,
} from "../types";

export const getMembershipPlans = async (
  includeInactive = false,
): Promise<MembershipPlanListResponse> => {
  const response = await api.get("/membership-plans", {
    params: {
      includeInactive,
    },
  });

  return response.data.data;
};

export const getMembershipPlan = async (
  planId: string,
): Promise<MembershipPlan> => {
  const response = await api.get(`/membership-plans/${planId}`);

  return response.data.data.plan;
};

export const createMembershipPlan = async (
  payload: CreateMembershipPlanPayload,
): Promise<MembershipPlan> => {
  const response = await api.post("/membership-plans", payload);

  return response.data.data.plan;
};

export const updateMembershipPlan = async (
  planId: string,
  payload: UpdateMembershipPlanPayload,
): Promise<MembershipPlan> => {
  const response = await api.patch(`/membership-plans/${planId}`, payload);

  return response.data.data.plan;
};

export const updateMembershipPlanStatus = async (
  planId: string,
  payload: UpdateMembershipPlanStatusPayload,
): Promise<MembershipPlan> => {
  const response = await api.patch(
    `/membership-plans/${planId}/status`,
    payload,
  );

  return response.data.data.plan;
};
