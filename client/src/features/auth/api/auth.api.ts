import { api } from "../../../lib/api";
import type { AuthResponse, LoginCredentials, User } from "../types/auth.types";

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

interface LogoutResponse {
  success: boolean;
  message: string;
}

export const registerUser = async (
  credentials: RegisterCredentials,
): Promise<User> => {
  const response = await api.post<RegisterResponse>(
    "/auth/register",
    credentials,
  );

  return response.data.data.user;
};

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<AuthResponse["data"]> => {
  const response = await api.post<AuthResponse>("/auth/login", credentials);

  return response.data.data;
};

export const refreshSession = async (): Promise<AuthResponse["data"]> => {
  const response = await api.post<AuthResponse>("/auth/refresh");

  return response.data.data;
};

export const logoutUser = async (): Promise<void> => {
  await api.post<LogoutResponse>("/auth/logout");
};

interface CurrentUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<CurrentUserResponse>("/users/me");

  return response.data.data.user;
};
