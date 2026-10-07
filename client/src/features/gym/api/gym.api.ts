import { api } from "../../../lib/api";

export interface Gym {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CurrentGymResponse {
  success: boolean;
  data: {
    gym: Gym;
  };
}

export const getCurrentGym = async (): Promise<Gym> => {
  const response = await api.get<CurrentGymResponse>("/gyms/current");

  return response.data.data.gym;
};
