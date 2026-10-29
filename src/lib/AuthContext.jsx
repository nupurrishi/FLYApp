import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import { currentUrl } from "@/lib/authReturnTo";

export const authQuery = queryOptions({
  queryKey: ["auth", "session"],
  queryFn: async () => {
    const result = await authClient.getSession();
    if (result.error) throw new Error(result.error.message || "Unable to check your session");
    const user = result.data?.user || null;
    return { user: user ? { ...user, full_name: user.full_name || user.name || user.email } : null, error: null };
  },
  staleTime: 30_000,
  retry: false,
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(authQuery);

  const value = useMemo(() => ({
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isLoadingAuth: isPending,
    authError: error ? { type: "unknown", message: error.message || "Failed to load session" } : null,
    refresh: () => queryClient.fetchQuery({ ...authQuery, staleTime: 0 }),
    logout: async () => {
      await authClient.signOut();
      queryClient.setQueryData(authQuery.queryKey, { user: null, error: null });
      window.location.assign("/login");
    },
    navigateToLogin: () => {
      const returnTo = encodeURIComponent(currentUrl());
      window.location.assign(`/login?returnTo=${returnTo}`);
    },
  }), [data, error, isPending, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
