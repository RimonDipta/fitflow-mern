import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshSession,
} from "../api/auth.api";
import type { LoginCredentials, User } from "../types/auth.types";
import { api } from "../../../lib/api";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const applyAccessToken = useCallback((token: string | null) => {
    setAccessToken(token);

    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      const result = await loginUser(credentials);

      setUser(result.user);
      applyAccessToken(result.accessToken);
    },
    [applyAccessToken],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
      applyAccessToken(null);
    }
  }, [applyAccessToken]);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async (): Promise<void> => {
      try {
        /*
         * The browser automatically sends the
         * HTTP-only refresh cookie.
         */
        const result = await refreshSession();

        if (!isMounted) {
          return;
        }

        setUser(result.user);
        applyAccessToken(result.accessToken);

        /*
         * Fetch the latest user record after
         * restoring the session.
         */
        try {
          const currentUser = await getCurrentUser();

          if (isMounted) {
            setUser(currentUser);
          }
        } catch {
          /*
           * The refresh response already contains
           * the authenticated user, so failure here
           * does not invalidate the session.
           */
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
        applyAccessToken(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, [applyAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, accessToken, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
};
