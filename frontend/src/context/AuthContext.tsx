import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { api, setAccessToken } from "@/api/client";
import type { AuthUser, LoginCredentials, RegisterData, TokenResponse } from "@/api/types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (creds: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  acceptInvite: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to restore session using the httpOnly refresh cookie.
  // If the cookie exists and is valid, we get a new access token silently.
  // If not, the user needs to log in.
  useEffect(() => {
    api
      .post<TokenResponse>("/auth/refresh")
      .then(({ data }) => {
        setAccessToken(data.access_token);
        setUser(data.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (creds: LoginCredentials) => {
    const { data } = await api.post<TokenResponse>("/auth/login", creds);
    setAccessToken(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (regData: RegisterData) => {
    const { data } = await api.post<TokenResponse>("/auth/register", regData);
    setAccessToken(data.access_token);
    setUser(data.user);
  }, []);

  const acceptInvite = useCallback(async (token: string, password: string) => {
    const { data } = await api.post<TokenResponse>("/auth/invite/accept", { token, password });
    setAccessToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // swallow — cookie will expire anyway
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        acceptInvite,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
