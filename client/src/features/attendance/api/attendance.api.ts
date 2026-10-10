import { api } from "../../../lib/api";

export interface AttendanceMemberSummary {
  id: string;
  name: string;
  memberCode: string;
}

export interface AttendanceRecord {
  id: string;
  gymId: string;
  memberId: string;
  member: AttendanceMemberSummary;
  checkInAt: string;
  checkOutAt?: string;
  checkedInBy: string;
  checkedOutBy?: string;
  durationMinutes: number | null;
}

export interface AttendanceListResponse {
  records: AttendanceRecord[];
  total: number;
  checkedInCount: number;
  checkedOutCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

interface AttendanceResponseData {
  attendance: AttendanceRecord;
}

export const getAttendance = async (
  date?: string,
  search?: string,
): Promise<AttendanceListResponse> => {
  const response = await api.get<ApiResponse<AttendanceListResponse>>(
    "/attendance",
    {
      params: {
        ...(date ? { date } : {}),
        ...(search?.trim() ? { search: search.trim() } : {}),
      },
    },
  );

  return response.data.data;
};

export const checkInMember = async (
  memberId: string,
): Promise<AttendanceRecord> => {
  const response = await api.post<ApiResponse<AttendanceResponseData>>(
    "/attendance/check-in",
    { memberId },
  );

  return response.data.data.attendance;
};

export const checkOutMember = async (
  attendanceId: string,
): Promise<AttendanceRecord> => {
  const response = await api.patch<ApiResponse<AttendanceResponseData>>(
    `/attendance/${attendanceId}/check-out`,
  );

  return response.data.data.attendance;
};
