import { redirect } from "@tanstack/react-router";
import { DefaultCatchBoundary } from "@/components/DefaultCatchBoundary";
import { authQuery } from "@/lib/AuthContext";

/**
 * The login gate for a pathless layout route (src/routes/_authed.jsx), which gates
 * every route under src/routes/_authed/ (their URLs carry no "_authed" segment):
 *
 *   createFileRoute("/_authed")({ ssr: false, beforeLoad: requireSignedIn, errorComponent: AuthGateError })
 *
 * beforeLoad resolves the Better Auth session before any child loader can run.
 */
export async function requireSignedIn({ context, location }) {
  // A session endpoint outage is an error, not a signed-out state.
  const { user, error } = await context.queryClient.ensureQueryData(authQuery);
  if (user) return { user };
  // Thrown rather than returned so the children's loaders never run without a user.
  // Return to the protected page after app sign-in.
  throw redirect({ to: "/login", search: { returnTo: location.href, from_url: location.href }, reloadDocument: true });
}

export function AuthGateError({ error }) {
  return <DefaultCatchBoundary error={error} />;
}
