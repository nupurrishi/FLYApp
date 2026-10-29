// Server-only authorization helpers. Every read and write in the app goes through
// these: the browser never touches protected records directly (entity rules are
// admin-only), so permissions are always re-checked on the server.

export const asItems = (res) => (Array.isArray(res) ? res : (res?.items ?? []));

export const isAdmin = (user) => user?.role === "admin";

const forbidden = () => Object.assign(new Error("You do not have permission to do that"), { status: 403 });

export async function requireUser(context) {
  const sdk = context.getBase44();
  let user = null;
  try {
    user = await sdk.auth.me();
  } catch (error) {
    if (![401, 403].includes(error?.status)) throw error;
  }
  if (!user?.id) throw Object.assign(new Error("Please sign in to continue"), { status: 401 });
  return { user, sdk, service: sdk.asServiceRole };
}

export async function requireAdmin(context) {
  const ctx = await requireUser(context);
  if (!isAdmin(ctx.user)) throw forbidden();
  return ctx;
}

export async function membershipsFor(service, user) {
  return asItems(await service.entities.EventMember.filter({ user_email: user.email }));
}

export async function membershipFor(service, user, eventId) {
  const rows = asItems(
    await service.entities.EventMember.filter({ event_id: eventId, user_email: user.email }),
  );
  return rows.find((row) => row.status !== "removed") || null;
}

// Any signed-in participant of the event (or an admin).
export async function requireEventMember(context, eventId, roles) {
  const ctx = await requireUser(context);
  const event = await ctx.service.entities.Event.get(eventId).catch(() => null);
  if (!event) throw Object.assign(new Error("Event not found"), { status: 404 });
  if (isAdmin(ctx.user)) return { ...ctx, membership: null };
  const membership = await membershipFor(ctx.service, ctx.user, eventId);
  if (!membership) throw forbidden();
  if (roles && !roles.includes(membership.role)) throw forbidden();
  return { ...ctx, membership };
}

export async function requireEventRole(context, eventId, roles) {
  const ctx = await requireEventMember(context, eventId, roles);
  if (!ctx.membership) return ctx;
  return ctx;
}

export const requireStageManager = (context, eventId) =>
  requireEventRole(context, eventId, ["stage_manager"]);

export const requireBackstageManager = (context, eventId) =>
  requireEventRole(context, eventId, ["backstage_manager"]);

export const requireOperationsManager = async (context, eventId) => {
  const ctx = await requireEventMember(context, eventId);
  if (isAdmin(ctx.user) || ["stage_manager", "backstage_manager"].includes(ctx.membership?.role)) return ctx;
  throw forbidden();
};

export function requireRoleInEvent(ctx, roles) {
  if (isAdmin(ctx.user)) return;
  if (!ctx.membership || !roles.includes(ctx.membership.role)) throw forbidden();
}

// Admins/managers only: events, people, schedules, show control.
export async function requireEventManager(context, eventId) {
  const ctx = await requireUser(context);
  if (isAdmin(ctx.user)) {
    if (eventId) {
      const event = await ctx.service.entities.Event.get(eventId).catch(() => null);
      if (!event) throw Object.assign(new Error("Event not found"), { status: 404 });
    }
    return { ...ctx, membership: null };
  }
  throw forbidden();
}

// Admins, or the designer who owns the record.
export async function requireDesignerOrAdmin(context, designerEmail) {
  const ctx = await requireUser(context);
  if (isAdmin(ctx.user)) return { ...ctx, membership: null };
  if (!designerEmail || designerEmail.toLowerCase() !== ctx.user.email?.toLowerCase()) throw forbidden();
  return { ...ctx, membership: null };
}

export async function visibleSchedule(service, user, eventId, role) {
  const items = asItems(await service.entities.ScheduleItem.filter({ event_id: eventId }));
  return items
    .filter((it) => {
      if (isAdmin(user) || role === "stage_manager" || role === "backstage_manager") return true;
      const audienceMatch =
        it.audience === "all" ||
        (it.audience === "models" && role === "model") ||
        (it.audience === "designers" && role === "designer");
      return audienceMatch || (it.assigned_emails || []).includes(user.email);
    })
    .sort((a, b) => `${a.date}${a.start_time || ""}`.localeCompare(`${b.date}${b.start_time || ""}`));
}

export async function notify(service, { eventId, emails, title, message, type, link }) {
  const unique = [...new Set((emails || []).filter(Boolean))];
  if (!unique.length) return;
  await service.entities.Notification.bulkCreate(
    unique.map((email) => ({
      user_email: email,
      event_id: eventId || "",
      title,
      message,
      type: type || "general",
      link: link || "",
      read: false,
    })),
  );
}

export async function eventAudience(service, eventId, audience = "all") {
  const members = asItems(await service.entities.EventMember.filter({ event_id: eventId }));
  return members
    .filter((m) => m.status !== "removed")
    .filter((m) =>
      audience === "models" ? m.role === "model" : audience === "designers" ? m.role === "designer" : true,
    )
    .map((m) => m.user_email);
}

export async function adminEmails(service) {
  const users = asItems(await service.entities.User.list());
  return users.filter((u) => u.role === "admin").map((u) => u.email);
}

export async function logAction(service, actor, action, { eventId, target, detail } = {}) {
  await service.entities.AuditLog.create({
    event_id: eventId || "",
    actor_email: actor.email,
    actor_name: actor.full_name || actor.email,
    action,
    target: target || "",
    detail: detail || "",
  });
}
