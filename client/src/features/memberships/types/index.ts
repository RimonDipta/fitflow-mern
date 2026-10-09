export type MembershipStatus = "ACTIVE" | "EXPIRED" | "CANCELLED";

export type MembershipPaymentStatus =
  | "PENDING"
  | "PAID"
  | "PARTIAL"
  | "REFUNDED";

export interface MembershipMember {
  id: string;
  name: string;
  memberCode: string;
}

export interface MembershipPlanSummary {
  id: string;
  name: string;
  durationDays: number;
}

export interface Membership {
  id: string;
  gymId: string;
  memberId: string;
  membershipPlanId: string;

  member: MembershipMember;
  plan: MembershipPlanSummary;

  startDate: string;
  endDate: string;

  price: number;
  paymentStatus: MembershipPaymentStatus;
  status: MembershipStatus;

  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface MembershipListResponse {
  memberships: Membership[];
  total: number;
}

export interface CreateMembershipPayload {
  memberId: string;
  membershipPlanId: string;
  startDate: string;
  paymentStatus?: MembershipPaymentStatus;
  notes?: string;
}

export interface UpdateMembershipPayload {
  paymentStatus?: MembershipPaymentStatus;
  status?: MembershipStatus;
  notes?: string;
}
