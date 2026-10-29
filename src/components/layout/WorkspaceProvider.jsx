import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { bootstrap } from "@/lib/server-fns";

const WorkspaceContext = createContext(null);
const STORAGE_KEY = "fly.activeEvent";

// Loads the signed-in visitor once for the whole workspace: their role, their events
// and which event they are currently working in.
export function WorkspaceProvider({ children }) {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["workspace"],
    queryFn: () => bootstrap(),
    staleTime: 20_000,
    retry: 1,
  });
  const [eventId, setEventId] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setEventId(saved);
  }, []);

  useEffect(() => {
    const events = data?.events || [];
    if (!events.length) return;
    if (events.some((e) => e.id === eventId)) return;
    const preferred = events.find((e) => e.status !== "archived") || events[0];
    setEventId(preferred.id);
    window.localStorage.setItem(STORAGE_KEY, preferred.id);
  }, [data, eventId]);

  const value = useMemo(() => {
    const events = data?.events || [];
    const activeEvent = events.find((e) => e.id === eventId) || null;
    const membership = (data?.memberships || []).find(
      (item) => item.event_id === activeEvent?.id && item.status !== "removed",
    );
    const role = data?.isAdmin ? "admin" : membership?.role || data?.role || "model";
    const selectEvent = (id) => {
      setEventId(id);
      window.localStorage.setItem(STORAGE_KEY, id);
    };
    return {
      user: data?.user || null,
      role,
      isAdmin: !!data?.isAdmin,
      memberships: data?.memberships || [],
      events,
      activeEvent,
      eventId: activeEvent?.id || "",
      selectEvent,
      unreadCount: data?.unreadCount || 0,
      isLoading,
      error,
      refresh: () => refetch(),
      resetQueries: () => queryClient.invalidateQueries(),
    };
  }, [data, eventId, isLoading, error, refetch, queryClient]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
