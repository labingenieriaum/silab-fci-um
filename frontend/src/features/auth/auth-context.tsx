import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiRequest } from "@/lib/api";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/auth-token";
import type { AuthResponse, AuthUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      if (!getAccessToken()) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await apiRequest<AuthUser>("/auth/me");
        if (active) {
          setUser(currentUser);
        }
      } catch {
        clearAccessToken();
        if (active) {
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      async login(correo: string, password: string) {
        const auth = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ correo, password })
        });
        setAccessToken(auth.accessToken);
        setTokenState(auth.accessToken);
        setUser(auth.user);
      },
      async logout() {
        await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
        clearAccessToken();
        setTokenState(null);
        setUser(null);
      },
      hasPermission(permission: string) {
        return user?.permissions.includes(permission) ?? false;
      }
    }),
    [accessToken, isLoading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
