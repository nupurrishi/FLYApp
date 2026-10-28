import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Images, Plus, Search } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import EventGate from "@/components/common/EventGate";
import Loading from "@/components/common/Loading";
import PageHeader from "@/components/common/PageHeader";
import CollectionFormDialog from "@/components/lookbook/CollectionFormDialog";
import LookCard from "@/components/lookbook/LookCard";
import LookDetailDialog from "@/components/lookbook/LookDetailDialog";
import LookFormDialog from "@/components/lookbook/LookFormDialog";
import { useWorkspace } from "@/components/layout/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { getLookbook } from "@/lib/server-fns";

export const Route = createFileRoute("/_authed/lookbook")({
  head: () => ({ meta: [{ title: "Lookbook · Fly Showcase" }] }),
  component: LookbookPage,
});

function LookbookPage() {
  const { user, role } = useWorkspace();
  return (
    <EventGate>{(event) => <LookbookContent event={event} user={user} role={role} />}</EventGate>
  );
}

function LookbookContent({ event, user, role }) {
  const { data, isLoading } = useQuery({
    queryKey: ["lookbook", event.id],
    queryFn: () => getLookbook({ data: { event_id: event.id } }),
  });

  const [search, setSearch] = useState("");
  const [designer, setDesigner] = useState("all");
  const [collection, setCollection] = useState("all");
  const [model, setModel] = useState("all");
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState({ open: false, look: null });
  const [collectionDialog, setCollectionDialog] = useState(false);

  const canManage = role === "admin" || role === "designer";
  const looks = data?.looks || [];
  const collections = data?.collections || [];
  const designers = data?.designers || [];
  const models = data?.models || [];
  const activeRole = data?.role || role;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return looks.filter((look) => {
      if (designer !== "all" && look.designer_name !== designer) return false;
      if (collection !== "all" && look.collection_id !== collection) return false;
      if (model !== "all" && !(look.assignments || []).some((a) => a.model_email === model)) return false;
      if (!term) return true;
      return [look.name, look.number, look.designer_name, look.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [looks, search, designer, collection, model]);

  const detailLook = detail ? looks.find((l) => l.id === detail.id) || detail : null;

  return (
    <div>
      <PageHeader
        eyebrow={`${event.name} · ${filtered.length} look${filtered.length === 1 ? "" : "s"}`}
        title="Lookbook"
        description="Every look in the production with its reference imagery, styling and models."
        actions={
          canManage ? (
            <>
              <Button
                variant="outline"
                className="rounded-none border-brand-line"
                onClick={() => setCollectionDialog(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Collection
              </Button>
              <Button
                className="rounded-none bg-brand-black hover:bg-brand-purple"
                onClick={() => setEditing({ open: true, look: null })}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New look
              </Button>
            </>
          ) : null
        }
      />

      {collections.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setCollection("all")}
            className={`shrink-0 border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] ${
              collection === "all" ? "border-brand-black bg-brand-black text-white" : "border-brand-line bg-white text-black/55"
            }`}
          >
            All collections
          </button>
          {collections.map((item) => (
            <button
              key={item.id}
              onClick={() => setCollection(item.id)}
              className={`shrink-0 border px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] ${
                collection === item.id ? "border-brand-purple bg-brand-purple text-white" : "border-brand-line bg-white text-black/55"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search looks, designers…"
            className="h-9 w-full border border-brand-line bg-white pl-9 pr-3 text-[12.5px] outline-none focus:border-brand-purple"
          />
        </div>
        {activeRole !== "designer" && designers.length > 0 && (
          <select
            value={designer}
            onChange={(e) => setDesigner(e.target.value)}
            className="h-9 border border-brand-line bg-white px-2 text-[12px] text-black/70"
          >
            <option value="all">All designers</option>
            {designers.map((item) => (
              <option key={item.user_email} value={item.full_name || item.user_email}>
                {item.full_name || item.user_email}
              </option>
            ))}
          </select>
        )}
        {activeRole !== "model" && models.length > 0 && (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 border border-brand-line bg-white px-2 text-[12px] text-black/70"
          >
            <option value="all">All models</option>
            {models.map((item) => (
              <option key={item.user_email} value={item.user_email}>
                {item.full_name || item.user_email}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <Loading label="Loading the lookbook" />
      ) : filtered.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((look) => (
            <LookCard key={look.id} look={look} onOpen={setDetail} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Images}
          title={canManage ? "No looks yet" : "No looks assigned to you yet"}
          description={
            canManage
              ? "Create a collection and add your first look with reference imagery."
              : "Your designer will assign your looks here before fittings."
          }
        />
      )}

      {detailLook && (
        <LookDetailDialog
          look={detailLook}
          collections={collections}
          models={models}
          role={activeRole}
          canManage={canManage}
          user={user}
          onEdit={() => {
            setEditing({ open: true, look: detailLook });
            setDetail(null);
          }}
          onClose={() => setDetail(null)}
        />
      )}

      {canManage && (
        <>
          <LookFormDialog
            event={event}
            look={editing.look}
            collections={collections.filter((c) => activeRole === "admin" || c.designer_email === user?.email)}
            designers={designers}
            currentEmail={user?.email}
            isAdmin={activeRole === "admin"}
            open={editing.open}
            onOpenChange={(open) => setEditing({ open, look: open ? editing.look : null })}
          />
          <CollectionFormDialog
            event={event}
            designers={designers}
            currentEmail={user?.email}
            isAdmin={activeRole === "admin"}
            open={collectionDialog}
            onOpenChange={setCollectionDialog}
          />
        </>
      )}
    </div>
  );
}