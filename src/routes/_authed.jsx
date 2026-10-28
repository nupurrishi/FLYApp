import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/layout/AppShell";
import { WorkspaceProvider } from "@/components/layout/WorkspaceProvider";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  beforeLoad: requireSignedIn,
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  return (
    <WorkspaceProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </WorkspaceProvider>
  );
}