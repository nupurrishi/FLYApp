import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { currentUrl } from "@/lib/authReturnTo";

const ALLOWED_ROLES = ["model", "designer", "admin"];

export const authQuery = queryOptions({
  queryKey: ["auth", "me"],
  queryFn: async () => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) return { user: null, error: null };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
      return {
        user: null,
        error: {
          type: "user_not_registered",
          message: "Your account profile is not ready. Contact the FLYApp team.",
        },
      };
    }

    return { user: { ...profile, authUser }, error: null };
  },
  staleTime: Infinity,
  retry: false,
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery(authQuery);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: authQuery.queryKey });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const value = useMemo(() => ({
    user: data?.user ?? null,
    isAuthenticated: !!data?.user,
    isLoadingAuth: isPending,
    authError: data?.error ?? (error ? { type: "unknown", message: error.message ?? "Unable to load your account." } : null),
    refresh: () => queryClient.fetchQuery({ ...authQuery, staleTime: 0 }),
    logout: async () => {
      await supabase.auth.signOut();
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
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within <AuthProvider>");
  return context;
}
