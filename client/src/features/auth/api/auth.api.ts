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

interface CurrentUserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

/**
 * Share a single refresh request between simultaneous callers.
 *
 * This prevents React StrictMode from sending concurrent
 * refresh requests during development and avoids racing
 * refresh-token rotation.
 */
let refreshSessionRequest: Promise<AuthResponse["data"]> | null = null;

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

export const refreshSession = (): Promise<AuthResponse["data"]> => {
  if (!refreshSessionRequest) {
    refreshSessionRequest = api
      .post<AuthResponse>("/auth/refresh")
      .then((response) => response.data.data)
      .finally(() => {
        refreshSessionRequest = null;
      });
  }

  return refreshSessionRequest;
};

export const logoutUser = async (): Promise<void> => {
  await api.post<LogoutResponse>("/auth/logout");
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<CurrentUserResponse>("/users/me");

  return response.data.data.user;
};
