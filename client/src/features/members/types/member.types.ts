export type MemberStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type MemberGender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface Member {
  id: string;
  gymId: string;
  userId?: string;
  memberCode: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: MemberGender;
  address?: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  height?: number;
  weight?: number;
  status: MemberStatus;
  joinedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberListResponse {
  members: Member[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMemberPayload {
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: MemberGender;
  address?: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  height?: number;
  weight?: number;
  joinedAt?: string;
  notes?: string;
}

export type UpdateMemberPayload = Partial<CreateMemberPayload>;

export interface UpdateMemberStatusPayload {
  status: MemberStatus;
}
