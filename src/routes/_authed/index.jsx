import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import DesignerDashboard from "@/components/dashboards/DesignerDashboard";
import ModelDashboard from "@/components/dashboards/ModelDashboard";
import EventGate from "@/components/common/EventGate";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Dashboard · Fly Showcase" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useWorkspace();
  return (
    <EventGate>
      {(event) =>
        role === "admin" ? (
          <AdminDashboard event={event} />
        ) : role === "designer" ? (
          <DesignerDashboard event={event} />
        ) : (
          <ModelDashboard event={event} />
        )
      }
    </EventGate>
  );
}