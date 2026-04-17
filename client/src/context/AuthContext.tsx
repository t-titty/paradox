import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, errorMessage, getToken, setToken } from "../lib/api.ts";
import { disconnectSocket, getSocket } from "../lib/socket.ts";
import type { User } from "../lib/types.ts";
import type { UserStatsDTO } from "../lib/duelTypes.ts";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login(identifier: string, password: string): Promise<void>;
  register(username: string, email: string, password: string): Promise<void>;
  logout(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyStats = useCallback((stats: UserStatsDTO) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            wisdomPoints: stats.wisdomPoints,
            civilityScore: stats.civilityScore,
            isPremium: stats.isPremium,
          }
        : prev,
    );
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ user: User }>("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to server-pushed stat updates (WP/civility). Re-attach whenever
  // the user logs in — the socket singleton survives, but the subscriber only
  // exists while someone is logged in to receive it.
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socket.on("user:update", applyStats);
    return () => {
      socket.off("user:update", applyStats);
    };
  }, [user, applyStats]);

  async function login(identifier: string, password: string) {
    try {
      const { data } = await api.post<{ user: User; token: string }>("/auth/login", {
        identifier,
        password,
      });
      setToken(data.token);
      setUser(data.user);
    } catch (e) {
      throw new Error(errorMessage(e, "Login failed."));
    }
  }

  async function register(username: string, email: string, password: string) {
    try {
      const { data } = await api.post<{ user: User; token: string }>("/auth/register", {
        username,
        email,
        password,
      });
      setToken(data.token);
      setUser(data.user);
    } catch (e) {
      throw new Error(errorMessage(e, "Registration failed."));
    }
  }

  function logout() {
    disconnectSocket();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
