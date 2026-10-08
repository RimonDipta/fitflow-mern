export type MembershipPlanStatus = "ACTIVE" | "INACTIVE";

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description?: string;
  durationDays: number;
  price: number;
  status: MembershipPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlanListResponse {
  plans: MembershipPlan[];
  total: number;
}

export interface CreateMembershipPlanPayload {
  name: string;
  description?: string;
  durationDays: number;
  price: number;
}

export type UpdateMembershipPlanPayload = Partial<CreateMembershipPlanPayload>;

export interface UpdateMembershipPlanStatusPayload {
  status: MembershipPlanStatus;
}
