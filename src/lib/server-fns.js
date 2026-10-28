import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  asItems,
  isAdmin,
  membershipsFor,
  requireEventMember,
  requireUser,
  visibleSchedule,
} from "@/lib/guard.server";
import { localStamp } from "@/lib/show-time";

const eventInput = z.object({ event_id: z.string().min(1) });
const idInput = z.object({ id: z.string().min(1) });

const freshUser = async (service, user) => {
  try {
    const record = await service.entities.User.get(user.id);
    return { ...user, ...record };
  } catch {
    return user;
  }
};

const sortSchedule = (items) =>
  [...items].sort((a, b) =>
    `${a.date}${a.start_time || ""}`.localeCompare(`${b.date}${b.start_time || ""}`),
  );

const upcomingFrom = (items, stamp) =>
  items.filter((it) => it.status !== "cancelled" && `${it.date}T${it.start_time || "00:00"}` >= stamp);

const roleFor = (user, memberships) =>
  isAdmin(user) ? "admin" : memberships.some((m) => m.role === "designer") ? "designer" : "model";

export const bootstrap = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { user, service } = await requireUser(context);
  const admin = isAdmin(user);
  const memberships = admin ? [] : await membershipsFor(service, user);

  let events = [];
  if (admin) {
    events = asItems(await service.entities.Event.list({ sort: "-start_date", limit: 100 }));
  } else {
    const ids = [...new Set(memberships.filter((m) => m.status !== "removed").map((m) => m.event_id))];
    const rows = await Promise.all(ids.map((id) => service.entities.Event.get(id).catch(() => null)));
    events = rows.filter(Boolean);
    events.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));
  }

  const unread = asItems(
    await service.entities.Notification.filter({ user_email: user.email, read: false }, { limit: 50 }),
  );

  return {
    user: await freshUser(service, user),
    isAdmin: admin,
    role: roleFor(user, memberships),
    memberships,
    events,
    unreadCount: unread.length,
  };
});

export const getEventWorkspace = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service, membership } = await requireEventMember(context, data.event_id);
    const event = await service.entities.Event.get(data.event_id);
    const [members, looks, segments, hma] = await Promise.all([
      service.entities.EventMember.filter({ event_id: data.event_id }),
      service.entities.Look.filter({ event_id: data.event_id }),
      service.entities.ShowSegment.filter({ event_id: data.event_id }),
      service.entities.HairMakeup.filter({ event_id: data.event_id }),
    ]);
    const memberRows = asItems(members).filter((m) => m.status !== "removed");
    return {
      event,
      membership,
      role: isAdmin(user) ? "admin" : membership?.role || "model",
      counts: {
        models: memberRows.filter((m) => m.role === "model").length,
        designers: memberRows.filter((m) => m.role === "designer").length,
        looks: asItems(looks).length,
        segments: asItems(segments).length,
        hairMakeup: asItems(hma).length,
      },
    };
  });

export const getModelDashboard = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventMember(context, data.event_id);
    const event = await service.entities.Event.get(data.event_id);
    const [schedule, looks, assignments, hmaAll, tasks, announcements, segments] = await Promise.all([
      visibleSchedule(service, user, data.event_id, "model"),
      service.entities.Look.filter({ event_id: data.event_id }),
      service.entities.LookAssignment.filter({ event_id: data.event_id, model_email: user.email }),
      service.entities.HairMakeup.filter({ event_id: data.event_id, model_email: user.email }),
      service.entities.ReadinessTask.filter({ event_id: data.event_id, user_email: user.email }),
      service.entities.Announcement.filter({ event_id: data.event_id }),
      service.entities.ShowSegment.filter({ event_id: data.event_id }),
    ]);

    const lookRows = asItems(looks);
    const assignmentRows = asItems(assignments);
    const myLooks = assignmentRows
      .map((a) => ({ assignment: a, look: lookRows.find((l) => l.id === a.look_id) }))
      .filter((row) => row.look);

    const stamp = localStamp(new Date(), event.timezone);
    const today = stamp.slice(0, 10);
    const upcoming = upcomingFrom(sortSchedule(schedule), stamp);
    const hma = asItems(hmaAll).sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`));

    const liveSegments = asItems(segments).sort((a, b) => (a.position || 0) - (b.position || 0));
    const currentSegment = liveSegments.find((s) => s.status === "on_stage");
    const mySegment = liveSegments.find((s) => (s.model_emails || []).includes(user.email));

    return {
      event,
      nextCall: upcoming[0] || null,
      todayItems: schedule.filter((it) => it.date === today && it.status !== "cancelled"),
      upcoming: upcoming.slice(0, 6),
      looks: myLooks,
      nextFitting: upcoming.find((it) => it.category === "fitting") || null,
      hairMakeup: hma.filter((h) => h.status !== "completed"),
      tasks: asItems(tasks).sort((a, b) => Number(a.done) - Number(b.done)),
      announcements: asItems(announcements).slice(0, 3),
      showStatus: event.show_status,
      currentSegment: currentSegment || null,
      mySegment: mySegment || null,
    };
  });

export const getDesignerDashboard = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventMember(context, data.event_id, ["designer"]);
    const event = await service.entities.Event.get(data.event_id);
    const [schedule, collections, looks, assignments, announcements] = await Promise.all([
      visibleSchedule(service, user, data.event_id, "designer"),
      service.entities.Collection.filter({ event_id: data.event_id }),
      service.entities.Look.filter({ event_id: data.event_id, designer_email: user.email }),
      service.entities.LookAssignment.filter({ event_id: data.event_id }),
      service.entities.Announcement.filter({ event_id: data.event_id }),
    ]);

    const lookRows = asItems(looks);
    const lookIds = lookRows.map((l) => l.id);
    const myAssignments = asItems(assignments).filter((a) => lookIds.includes(a.look_id));
    const stamp = localStamp(new Date(), event.timezone);
    const upcoming = upcomingFrom(sortSchedule(schedule), stamp);

    const missing = lookRows.filter(
      (l) => !(l.images || []).length || ["draft", "missing"].includes(l.prep_status),
    );

    return {
      event,
      collections: asItems(collections).filter((c) => c.designer_email === user.email),
      looks: lookRows,
      assignments: myAssignments,
      models: [...new Set(myAssignments.map((a) => a.model_name || a.model_email))],
      fittings: upcoming.filter((it) => it.category === "fitting"),
      upcoming: upcoming.slice(0, 6),
      missing,
      announcements: asItems(announcements).slice(0, 3),
      showStatus: event.show_status,
    };
  });

export const getAdminDashboard = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventMember(context, data.event_id);
    if (!isAdmin(user)) throw Object.assign(new Error("Forbidden"), { status: 403 });
    const event = await service.entities.Event.get(data.event_id);
    const [members, looks, segments, hma, schedule, audit, announcements, applications] =
      await Promise.all([
        service.entities.EventMember.filter({ event_id: data.event_id }),
        service.entities.Look.filter({ event_id: data.event_id }),
        service.entities.ShowSegment.filter({ event_id: data.event_id }),
        service.entities.HairMakeup.filter({ event_id: data.event_id }),
        service.entities.ScheduleItem.filter({ event_id: data.event_id }),
        service.entities.AuditLog.filter({ event_id: data.event_id }, { limit: 8 }),
        service.entities.Announcement.filter({ event_id: data.event_id }),
        service.entities.Application.filter({}, { limit: 100 }),
      ]);

    const memberRows = asItems(members).filter((m) => m.status !== "removed");
    const lookRows = asItems(looks);
    const segmentRows = asItems(segments).sort((a, b) => (a.position || 0) - (b.position || 0));
    const hmaRows = asItems(hma);
    const scheduleRows = sortSchedule(asItems(schedule));
    const stamp = localStamp(new Date(), event.timezone);

    return {
      event,
      counts: {
        models: memberRows.filter((m) => m.role === "model").length,
        designers: memberRows.filter((m) => m.role === "designer").length,
        invited: memberRows.filter((m) => m.status === "invited").length,
        looks: lookRows.length,
        readyLooks: lookRows.filter((l) => l.prep_status === "ready").length,
        missingLooks: lookRows.filter((l) => !(l.images || []).length || l.prep_status === "missing").length,
        segments: segmentRows.length,
        segmentsDone: segmentRows.filter((s) => s.status === "completed").length,
        hma: hmaRows.length,
        hmaDone: hmaRows.filter((h) => h.status === "completed").length,
        scheduleUpcoming: upcomingFrom(scheduleRows, stamp).length,
        applications: asItems(applications).filter((a) => a.status === "submitted").length,
      },
      todayItems: scheduleRows.filter((it) => it.date === stamp.slice(0, 10)),
      upcoming: upcomingFrom(scheduleRows, stamp).slice(0, 6),
      currentSegment: segmentRows.find((s) => s.status === "on_stage") || null,
      nextSegment:
        segmentRows.find((s) => s.status === "on_deck") ||
        segmentRows.find((s) => s.status === "pending" || s.status === "ready") ||
        null,
      segments: segmentRows,
      unassignedLooks: lookRows.filter((l) => !l.prep_status || l.prep_status === "draft").length,
      audit: asItems(audit),
      announcements: asItems(announcements).slice(0, 3),
    };
  });

export const getSchedule = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service, membership } = await requireEventMember(context, data.event_id);
    const role = isAdmin(user) ? "admin" : membership?.role || "model";
    return visibleSchedule(service, user, data.event_id, role);
  });

export const getLookbook = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service, membership } = await requireEventMember(context, data.event_id);
    const admin = isAdmin(user);
    const role = admin ? "admin" : membership?.role || "model";
    const [looks, collections, assignments, members] = await Promise.all([
      service.entities.Look.filter({ event_id: data.event_id }),
      service.entities.Collection.filter({ event_id: data.event_id }),
      service.entities.LookAssignment.filter({ event_id: data.event_id }),
      service.entities.EventMember.filter({ event_id: data.event_id }),
    ]);

    const memberRows = asItems(members).filter((m) => m.status !== "removed");
    const assignmentRows = asItems(assignments);
    let lookRows = asItems(looks);

    if (role === "model") {
      const mine = assignmentRows.filter((a) => a.model_email === user.email).map((a) => a.look_id);
      lookRows = lookRows.filter((l) => mine.includes(l.id));
    } else if (role === "designer" && !admin) {
      lookRows = lookRows.filter((l) => l.designer_email === user.email);
    }

    return {
      role,
      looks: lookRows.map((look) => ({
        ...look,
        assignments: assignmentRows.filter((a) => a.look_id === look.id),
      })),
      collections: asItems(collections),
      models: memberRows.filter((m) => m.role === "model"),
      designers: memberRows.filter((m) => m.role === "designer"),
    };
  });

export const getHairMakeupBoard = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service, membership } = await requireEventMember(context, data.event_id);
    const role = isAdmin(user) ? "admin" : membership?.role || "model";
    const [appointments, members] = await Promise.all([
      service.entities.HairMakeup.filter({ event_id: data.event_id }),
      service.entities.EventMember.filter({ event_id: data.event_id }),
    ]);
    let rows = asItems(appointments);
    if (role === "model") rows = rows.filter((a) => a.model_email === user.email);
    if (role === "designer") {
      const looks = asItems(
        await service.entities.Look.filter({ event_id: data.event_id, designer_email: user.email }),
      );
      const lookIds = looks.map((l) => l.id);
      const assigns = asItems(await service.entities.LookAssignment.filter({ event_id: data.event_id }));
      const emails = assigns.filter((a) => lookIds.includes(a.look_id)).map((a) => a.model_email);
      rows = rows.filter((a) => emails.includes(a.model_email));
    }
    return {
      role,
      appointments: rows.sort((a, b) =>
        `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`),
      ),
      models: asItems(members)
        .filter((m) => m.role === "model" && m.status !== "removed")
        .map((m) => ({ email: m.user_email, name: m.full_name || m.user_email })),
    };
  });

export const getLiveShow = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service, membership } = await requireEventMember(context, data.event_id);
    const event = await service.entities.Event.get(data.event_id);
    const segments = asItems(await service.entities.ShowSegment.filter({ event_id: data.event_id })).sort(
      (a, b) => (a.position || 0) - (b.position || 0),
    );
    const role = isAdmin(user) ? "admin" : membership?.role || "model";
    return {
      event,
      role,
      canControl: isAdmin(user),
      segments,
      mine: segments.filter((s) => (s.model_emails || []).includes(user.email)),
    };
  });

export const getNotifications = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { user, service } = await requireUser(context);
  const rows = asItems(
    await service.entities.Notification.filter({ user_email: user.email }, { limit: 200 }),
  );
  const events = asItems(await service.entities.Event.list({ limit: 100 }));
  return {
    notifications: rows.sort((a, b) => (b.created_date || "").localeCompare(a.created_date || "")),
    events: events.map((e) => ({ id: e.id, name: e.name })),
  };
});

export const toggleTask = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1), done: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { user, service } = await requireUser(context);
    const task = await service.entities.ReadinessTask.get(data.id).catch(() => null);
    if (!task) throw Object.assign(new Error("Task not found"), { status: 404 });
    if (task.user_email !== user.email && !isAdmin(user))
      throw Object.assign(new Error("You cannot update this task"), { status: 403 });
    await service.entities.ReadinessTask.update(data.id, { done: data.done });
    return { ok: true };
  });

export const getOpportunities = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { user, service } = await requireUser(context);
  const [opportunities, mine] = await Promise.all([
    service.entities.Opportunity.list({ sort: "-created_date", limit: 100 }),
    service.entities.Application.filter({ user_email: user.email }, { limit: 100 }),
  ]);
  const rows = asItems(opportunities);
  return {
    opportunities: isAdmin(user) ? rows : rows.filter((o) => o.status !== "archived"),
    applications: asItems(mine),
    isAdmin: isAdmin(user),
  };
});

export const getProfileData = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const { user, service } = await requireUser(context);
  const memberships = await membershipsFor(service, user);
  const events = asItems(await service.entities.Event.list({ limit: 100 }));
  const designerProfile = asItems(
    await service.entities.DesignerProfile.filter({ user_email: user.email }),
  )[0] || null;
  return {
    user: await freshUser(service, user),
    memberships: memberships.map((m) => ({
      ...m,
      event: events.find((e) => e.id === m.event_id) || null,
    })),
    designerProfile,
    role: roleFor(user, memberships),
  };
});

export const getAdminWorkspace = createServerFn({ method: "POST" })
  .validator(eventInput)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventMember(context, data.event_id);
    if (!isAdmin(user)) throw Object.assign(new Error("Forbidden"), { status: 403 });
    const [members, users, applications, audit, opportunities, tasks, announcements] = await Promise.all([
      service.entities.EventMember.filter({ event_id: data.event_id }),
      service.entities.User.list(),
      service.entities.Application.filter({}, { limit: 200 }),
      service.entities.AuditLog.filter({ event_id: data.event_id }, { limit: 40 }),
      service.entities.Opportunity.list({ sort: "-created_date", limit: 100 }),
      service.entities.ReadinessTask.filter({ event_id: data.event_id }),
      service.entities.Announcement.filter({ event_id: data.event_id }),
    ]);
    return {
      announcements: asItems(announcements).sort((a, b) =>
        (b.created_date || "").localeCompare(a.created_date || ""),
      ),
      members: asItems(members).filter((m) => m.status !== "removed"),
      users: asItems(users).map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name || u.email,
        role: u.role,
      })),
      applications: asItems(applications),
      audit: asItems(audit),
      opportunities: asItems(opportunities),
      tasks: asItems(tasks),
    };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .validator(idInput)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireUser(context);
    await service.entities.Notification.deleteMany({ id: data.id, user_email: user.email });
    return { ok: true };
  });