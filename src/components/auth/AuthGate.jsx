import { redirect } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { UserNotRegistered } from "@/components/auth/UserNotRegistered";
import { authQuery } from "@/lib/AuthContext";

class NotRegisteredError extends Error {}

export async function requireSignedIn({ context, location }) {
  const { user, error } = await context.queryClient.ensureQueryData(authQuery);
  if (user) return { user };
  if (error?.type === "user_not_registered") throw new NotRegisteredError(error.message);
  throw redirect({ to: "/login", search: { returnTo: location.href } });
}

export function AuthGateError({ error }) {
  return error instanceof NotRegisteredError ? <UserNotRegistered /> : <DefaultCatchBoundary error={error} />;
}
