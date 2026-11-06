import { createClient } from "@supabase/supabase-js";
import { createMiddleware } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { supabase } from "@/lib/supabase";
import { createSheetsService } from "@/lib/sheets-entity-adapter.server";

const ALLOWED_ROLES = ["model", "designer", "admin"];

async function resolveUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;

  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase server configuration is missing.");

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user: authUser }, error } = await client.auth.getUser(token);
  if (error || !authUser) return null;

  const { data: profile, error: profileError } = await client
    .from("profiles").select("id,email,full_name,role").eq("id", authUser.id).maybeSingle();
  if (profileError) throw profileError;
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) return null;
  return { ...profile, id: authUser.id, email: profile.email || authUser.email };
}

function withSheetsContext(next, request) {
  let servicePromise;
  const getBase44 = () => {
    if (!servicePromise) {
      servicePromise = resolveUser(request).then((user) => {
        if (!user) throw Object.assign(new Error("Please sign in to continue"), { status: 401 });
        return createSheetsService(user);
      });
    }
    // The old code expects a synchronous client facade, so expose lazy async methods.
    return createLazyFacade(() => servicePromise);
  };
  return next({ context: { getBase44 } });
}

function createLazyFacade(getService) {
  const entityNames = ["Event","EventMember","ScheduleItem","Collection","Look","LookAssignment","HairMakeup","ShowSegment","Announcement","Notification","ReadinessTask","AuditLog","DesignerProfile","Opportunity","Application","User"];
  const facade = { auth: { me: async () => (await getService()).auth.me() }, entities: {} };
  for (const name of entityNames) {
    facade.entities[name] = {};
    for (const method of ["list","filter","get","create","bulkCreate","update","delete","deleteMany"]) {
      facade.entities[name][method] = (...args) => getService().then((service) => service.entities[name][method](...args));
    }
  }
  facade.asServiceRole = { entities: facade.entities };
  return facade;
}

export const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { data: { session } } = await supabase.auth.getSession();
    return next({ headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {} });
  })
  .server(({ next }) => withSheetsContext(next, getRequest()));

export const base44RequestMiddleware = createMiddleware({ type: "request" }).server(({ next, request }) =>
  withSheetsContext(next, request),
);

const currentUser = (context) => context.getBase44().auth.me().catch((error) => {
  if (error?.status === 401 || error?.status === 403) return null;
  throw error;
});

export const requireUser = createMiddleware({ type: "function" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) {
    setResponseStatus(401);
    throw Object.assign(new Error("Unauthorized"), { status: 401, code: "UNAUTHORIZED" });
  }
  return next({ context: { user } });
});

export const requireUserRoute = createMiddleware({ type: "request" }).server(async ({ next, context }) => {
  const user = await currentUser(context);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return next({ context: { user } });
});
