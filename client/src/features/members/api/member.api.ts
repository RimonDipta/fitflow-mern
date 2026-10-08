import { api } from "../../../lib/api";
import type {
  CreateMemberPayload,
  Member,
  MemberListResponse,
  UpdateMemberPayload,
  UpdateMemberStatusPayload,
} from "../types/member.types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface MemberResponseData {
  member: Member;
}

export const getMembers = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<MemberListResponse> => {
  const response = await api.get<ApiResponse<MemberListResponse>>("/members", {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
    },
  });

  return response.data.data;
};

export const getMember = async (memberId: string): Promise<Member> => {
  const response = await api.get<ApiResponse<MemberResponseData>>(
    `/members/${memberId}`,
  );

  return response.data.data.member;
};

export const createMember = async (
  payload: CreateMemberPayload,
): Promise<Member> => {
  const response = await api.post<ApiResponse<MemberResponseData>>(
    "/members",
    payload,
  );

  return response.data.data.member;
};

export const updateMember = async (
  memberId: string,
  payload: UpdateMemberPayload,
): Promise<Member> => {
  const response = await api.patch<ApiResponse<MemberResponseData>>(
    `/members/${memberId}`,
    payload,
  );

  return response.data.data.member;
};

export const updateMemberStatus = async (
  memberId: string,
  payload: UpdateMemberStatusPayload,
): Promise<Member> => {
  const response = await api.patch<ApiResponse<MemberResponseData>>(
    `/members/${memberId}/status`,
    payload,
  );

  return response.data.data.member;
};

export const deleteMember = async (memberId: string): Promise<void> => {
  await api.delete(`/members/${memberId}`);
};
