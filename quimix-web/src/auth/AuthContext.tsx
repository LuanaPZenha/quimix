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
  SESSION_EXPIRED_EVENT,
  SESSION_REFRESHED_EVENT,
  clearSession,
  fetchMe,
  loadStoredUser,
  loginUser,
  refreshSession,
  registerUser,
  saveSession,
  type Role,
  type User,
} from "../api/client";

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    full_name: string;
    role: Role;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());

  useEffect(() => {
    const onExpired = () => setUser(null);
    const onRefreshed = (event: Event) => {
      const next = (event as CustomEvent<User>).detail;
      if (next) setUser(next);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener(SESSION_REFRESHED_EVENT, onRefreshed as EventListener);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener(SESSION_REFRESHED_EVENT, onRefreshed as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!loadStoredUser()) return;
    void (async () => {
      try {
        setUser(await fetchMe());
      } catch {
        const restored = await refreshSession();
        if (!restored) {
          clearSession();
          setUser(null);
        }
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await loginUser({ email, password });
    saveSession(tokens);
    setUser(tokens.user);
  }, []);

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      full_name: string;
      role: Role;
    }) => {
      const tokens = await registerUser(input);
      saveSession(tokens);
      setUser(tokens.user);
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
