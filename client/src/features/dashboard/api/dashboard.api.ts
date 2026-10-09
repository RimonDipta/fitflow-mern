import { api } from "../../../lib/api";

export interface DashboardStats {
  totalMembers: number;
  activeMemberships: number;
  expiredMemberships: number;
  cancelledMemberships: number;
  pendingPayments: number;
  partialPayments: number;
  expiringWithin7Days: number;
}

interface DashboardStatsResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStatsResponse>("/dashboard/stats");

  return response.data.data.stats;
};
