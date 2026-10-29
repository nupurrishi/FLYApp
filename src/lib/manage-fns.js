import { createServerFn } from "@tanstack/react-start";
import { sendAccountEmail } from "@/lib/mail.server";
import { z } from "zod";
import {
  asItems,
  adminEmails,
  eventAudience,
  isAdmin,
  membershipFor,
  logAction,
  notify,
  requireAdmin,
  requireEventMember,
  requireDesignerOrAdmin,
  requireEventManager,
  requireStageManager,
  requireBackstageManager,
  requireOperationsManager,
  requireUser,
} from "@/lib/guard.server";

const opt = (max) => z.string().max(max).optional();
const email = z
  .string()
  .email()
  .min(3)
  .max(200)
  .transform((value) => value.trim().toLowerCase());
const idOnly = z.object({ id: z.string().min(1) });

/* ---------------------------------- events --------------------------------- */

const eventSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(160),
  tagline: opt(200),
  description: opt(4000),
  cover_image: opt(2000),
  start_date: z.iso.date(),
  end_date: z.iso.date().optional(),
  timezone: z.string().min(1).max(60),
  venue_name: opt(200),
  venue_address: opt(400),
  city: opt(120),
  status: z.enum(["planning", "published", "active", "completed", "archived"]).optional(),
  notes: opt(2000),
});

export const saveEvent = createServerFn({ method: "POST" })
  .validator(eventSchema)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireAdmin(context);
    const { id, ...fields } = data;
    const record = id
      ? await service.entities.Event.update(id, fields)
      : await service.entities.Event.create(fields);
    await logAction(service, user, id ? "Updated event" : "Created event", {
      eventId: record.id,
      target: record.name,
    });
    return record;
  });

export const setEventStatus = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().min(1),
      status: z.enum(["planning", "published", "active", "completed", "archived"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireAdmin(context);
    const event = await service.entities.Event.update(data.id, { status: data.status });
    await logAction(service, user, `Event marked ${data.status}`, {
      eventId: data.id,
      target: event.name,
    });
    if (data.status === "published") {
      await notify(service, {
        eventId: data.id,
        emails: await eventAudience(service, data.id, "all"),
        title: `${event.name} is published`,
        message: "The event workspace is now open. Check your schedule for call times.",
        type: "announcement",
        link: "/events",
      });
    }
    return event;
  });

export const setShowStatus = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().min(1), show_status: z.enum(["idle", "live", "ended"]) }))
  .handler(async ({ data, context }) => {
    const { user, service } = await requireStageManager(context, data.id);
    const event = await service.entities.Event.update(data.id, { show_status: data.show_status });
    await logAction(service, user, `Show set to ${data.show_status}`, { eventId: data.id, target: event.name });
    if (data.show_status === "live") {
      await notify(service, {
        eventId: data.id,
        emails: await eventAudience(service, data.id, "all"),
        title: "The show is live",
        message: "The runway is live. Follow the running order and stay backstage until your segment.",
        type: "show",
        link: "/live",
      });
    }
    return event;
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireAdmin(context);
    const event = await service.entities.Event.get(data.id).catch(() => null);
    if (!event) return { ok: true };
    await Promise.all([
      service.entities.EventMember.deleteMany({ event_id: data.id }),
      service.entities.ScheduleItem.deleteMany({ event_id: data.id }),
      service.entities.Collection.deleteMany({ event_id: data.id }),
      service.entities.Look.deleteMany({ event_id: data.id }),
      service.entities.LookAssignment.deleteMany({ event_id: data.id }),
      service.entities.HairMakeup.deleteMany({ event_id: data.id }),
      service.entities.ShowSegment.deleteMany({ event_id: data.id }),
      service.entities.Announcement.deleteMany({ event_id: data.id }),
      service.entities.ReadinessTask.deleteMany({ event_id: data.id }),
      service.entities.Notification.deleteMany({ event_id: data.id }),
    ]);
    await service.entities.Event.delete(data.id);
    await logAction(service, user, "Deleted event", { target: event.name });
    return { ok: true };
  });

/* ---------------------------------- people --------------------------------- */

export const saveMember = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      event_id: z.string().min(1),
      user_email: email,
      full_name: opt(160),
      role: z.enum(["model", "designer", "stage_manager", "backstage_manager"]),
      phone: opt(40),
      status: z.enum(["invited", "active", "removed"]).optional(),
      notes: opt(1000),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventManager(context, data.event_id);
    const event = await service.entities.Event.get(data.event_id);
    const existing = asItems(await service.entities.EventMember.filter({
      event_id: data.event_id,
      user_email: data.user_email,
    }));
    if (existing.some((row) => row.id !== data.id && row.status !== "removed")) {
      throw Object.assign(new Error("This person is already on the event team"), { status: 409 });
    }
    if (data.id) {
      const previous = await service.entities.EventMember.get(data.id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id) {
        throw Object.assign(new Error("Team member not found for this event"), { status: 404 });
      }
    }
    const users = asItems(await service.entities.User.list());
    const matched = users.find((u) => (u.email || "").toLowerCase() === data.user_email);
    const payload = {
      ...data,
      user_id: matched?.id || "",
      full_name: data.full_name || matched?.full_name || data.user_email,
      status: data.status || (matched ? "active" : "invited"),
    };
    delete payload.id;
    const record = data.id
      ? await service.entities.EventMember.update(data.id, payload)
      : await service.entities.EventMember.create(payload);

    if (record.role === "designer") {
      const existing = asItems(
        await service.entities.DesignerProfile.filter({ user_email: record.user_email }),
      );
      if (!existing.length) {
        await service.entities.DesignerProfile.create({
          user_email: record.user_email,
          full_name: record.full_name,
          brand_name: record.full_name,
          event_id: data.event_id,
        });
      }
    }

    await notify(service, {
      eventId: data.event_id,
      emails: [record.user_email],
      title: `${event.name}: you're on the ${record.role} team`,
      message: `You have been added as a ${record.role} for ${event.name}. Check your schedule and assignments.`,
      type: "assignment",
      link: "/",
    });
    await logAction(service, user, data.id ? "Updated team member" : "Added team member", {
      eventId: data.event_id,
      target: record.full_name,
      detail: record.role,
    });
    return record;
  });

export const removeMember = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventManager(context);
    const member = await service.entities.EventMember.get(data.id).catch(() => null);
    if (!member) return { ok: true };
    await service.entities.EventMember.delete(data.id);
    await logAction(service, user, "Removed team member", {
      eventId: member.event_id,
      target: member.full_name || member.user_email,
    });
    return { ok: true };
  });

export const inviteToApp = createServerFn({ method: "POST" })
  .validator(z.object({ email }))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    try {
      const appUrl = process.env.BETTER_AUTH_URL;
      if (!appUrl) throw new Error("BETTER_AUTH_URL is not configured");
      await sendAccountEmail({
        to: data.email,
        subject: "You have been invited to FLYApp",
        url: `${appUrl}/register?email=${encodeURIComponent(data.email)}`,
        intro: "An event administrator added you to the FLYApp team. Create your account with this email address to view your event workspace.",
      });
      return { invited: true };
    } catch (error) {
      return { invited: false, message: error?.message || "Invite could not be sent" };
    }
  });

/* --------------------------------- schedule -------------------------------- */

const scheduleSchema = z.object({
  id: z.string().optional(),
  event_id: z.string().min(1),
  title: z.string().min(1).max(160),
  description: opt(2000),
  date: z.iso.date(),
  start_time: opt(10),
  end_time: opt(10),
  timezone: z.string().min(1).max(60),
  location: opt(200),
  category: z.enum([
    "call_time", "rehearsal", "fitting", "hair_makeup", "wardrobe", "runway", "break", "meeting", "other",
  ]),
  status: z.enum(["upcoming", "in_progress", "completed", "cancelled"]).optional(),
  instructions: opt(2000),
  assigned_emails: z.array(z.string().max(200)).max(200).optional(),
  audience: z.enum(["all", "models", "designers"]).optional(),
});

export const saveScheduleItem = createServerFn({ method: "POST" })
  .validator(scheduleSchema)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireStageManager(context, data.event_id);
    const { id, ...fields } = data;
    const assignedEmails = [...new Set((fields.assigned_emails || []).map((value) => value.trim().toLowerCase()))];
    if (assignedEmails.length) {
      const members = asItems(await service.entities.EventMember.filter({ event_id: data.event_id }));
      const allowedEmails = new Set(members.filter((member) => member.status !== "removed").map((member) => member.user_email?.toLowerCase()));
      if (assignedEmails.some((emailAddress) => !allowedEmails.has(emailAddress))) {
        throw Object.assign(new Error("Assigned people must belong to this event"), { status: 400 });
      }
      fields.assigned_emails = assignedEmails;
    }
    if (id) {
      const previous = await service.entities.ScheduleItem.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id) {
        throw Object.assign(new Error("Schedule item not found for this event"), { status: 404 });
      }
    }
    const record = id
      ? await service.entities.ScheduleItem.update(id, fields)
      : await service.entities.ScheduleItem.create(fields);

    const explicit = record.assigned_emails || [];
    const recipients = explicit.length
      ? explicit
      : await eventAudience(service, data.event_id, record.audience || "all");
    const when = `${record.date}${record.start_time ? ` at ${record.start_time}` : ""}`;
    await notify(service, {
      eventId: data.event_id,
      emails: recipients,
      title: id ? `Schedule updated: ${record.title}` : `New schedule item: ${record.title}`,
      message: `${record.title} — ${when}${record.location ? ` · ${record.location}` : ""}`,
      type: "schedule",
      link: "/schedule",
    });
    await logAction(service, user, id ? "Updated schedule item" : "Added schedule item", {
      eventId: data.event_id,
      target: record.title,
      detail: when,
    });
    return record;
  });

export const setScheduleStatus = createServerFn({ method: "POST" })
  .validator(idOnly.extend({ status: z.enum(["upcoming", "in_progress", "completed", "cancelled"]) }))
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const item = await lookup.entities.ScheduleItem.get(data.id).catch(() => null);
    if (!item) throw Object.assign(new Error("Schedule item not found"), { status: 404 });
    const { service } = await requireStageManager(context, item.event_id);
    return service.entities.ScheduleItem.update(data.id, { status: data.status });
  });

export const deleteScheduleItem = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const item = await lookup.entities.ScheduleItem.get(data.id).catch(() => null);
    if (!item) return { ok: true };
    const { user, service } = await requireStageManager(context, item.event_id);
    await service.entities.ScheduleItem.delete(data.id);
    await logAction(service, user, "Deleted schedule item", { eventId: item.event_id, target: item.title });
    return { ok: true };
  });

/* --------------------------------- lookbook -------------------------------- */

const collectionSchema = z.object({
  id: z.string().optional(),
  event_id: z.string().min(1),
  designer_email: email,
  designer_name: opt(160),
  name: z.string().min(1).max(160),
  season: opt(120),
  description: opt(2000),
  cover_image: opt(2000),
  status: z.enum(["draft", "in_progress", "ready"]).optional(),
});

export const saveCollection = createServerFn({ method: "POST" })
  .validator(collectionSchema)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventMember(context, data.event_id, ["designer"]);
    await requireDesignerOrAdmin(context, data.designer_email);
    if (!isAdmin(user) && data.designer_email.toLowerCase() !== user.email?.toLowerCase()) {
      throw Object.assign(new Error("You may only manage your own collections"), { status: 403 });
    }
    const { id, ...fields } = data;
    if (id) {
      const previous = await service.entities.Collection.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id || (!isAdmin(user) && previous.designer_email?.toLowerCase() !== user.email?.toLowerCase())) {
        throw Object.assign(new Error("Collection not found for this event"), { status: 404 });
      }
    }
    const record = id
      ? await service.entities.Collection.update(id, fields)
      : await service.entities.Collection.create(fields);
    await logAction(service, user, id ? "Updated collection" : "Created collection", {
      eventId: data.event_id,
      target: record.name,
    });
    return record;
  });

export const deleteCollection = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const collection = await lookup.entities.Collection.get(data.id).catch(() => null);
    if (!collection) return { ok: true };
    const { user, service } = await requireEventMember(context, collection.event_id, ["designer"]);
    await requireDesignerOrAdmin(context, collection.designer_email);
    if (!isAdmin(user) && collection.designer_email?.toLowerCase() !== user.email?.toLowerCase()) {
      throw Object.assign(new Error("You may only manage your own collections"), { status: 403 });
    }
    const looks = asItems(await service.entities.Look.filter({
      collection_id: data.id,
      event_id: collection.event_id,
    }));
    await Promise.all(looks.map((l) => service.entities.LookAssignment.deleteMany({
      look_id: l.id,
      event_id: collection.event_id,
    })));
    await service.entities.Look.deleteMany({ collection_id: data.id, event_id: collection.event_id });
    await service.entities.Collection.delete(data.id);
    return { ok: true };
  });

const lookSchema = z.object({
  id: z.string().optional(),
  event_id: z.string().min(1),
  collection_id: opt(80),
  designer_email: email,
  designer_name: opt(160),
  number: opt(20),
  name: z.string().min(1).max(160),
  images: z.array(z.string().max(2000)).max(12).optional(),
  description: opt(2000),
  accessories: opt(1000),
  footwear: opt(1000),
  styling_instructions: opt(2000),
  fitting_notes: opt(2000),
  prep_status: z.enum(["draft", "in_progress", "ready", "missing"]).optional(),
  notes: opt(2000),
});

export const saveLook = createServerFn({ method: "POST" })
  .validator(lookSchema)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireEventMember(context, data.event_id, ["designer"]);
    await requireDesignerOrAdmin(context, data.designer_email);
    if (!isAdmin(user) && data.designer_email.toLowerCase() !== user.email?.toLowerCase()) {
      throw Object.assign(new Error("You may only manage your own looks"), { status: 403 });
    }
    const { id, ...fields } = data;
    if (id) {
      const previous = await service.entities.Look.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id || (!isAdmin(user) && previous.designer_email?.toLowerCase() !== user.email?.toLowerCase())) {
        throw Object.assign(new Error("Look not found for this event"), { status: 404 });
      }
    }
    if (fields.collection_id) {
      const collection = await service.entities.Collection.get(fields.collection_id).catch(() => null);
      if (!collection || collection.event_id !== data.event_id || (!isAdmin(user) && collection.designer_email?.toLowerCase() !== user.email?.toLowerCase())) {
        throw Object.assign(new Error("Choose a collection you can access in this event"), { status: 400 });
      }
    }
    const record = id
      ? await service.entities.Look.update(id, fields)
      : await service.entities.Look.create(fields);
    await logAction(service, user, id ? "Updated look" : "Created look", {
      eventId: data.event_id,
      target: `${record.number || ""} ${record.name}`.trim(),
    });
    return record;
  });

export const deleteLook = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: peek } = await requireUser(context);
    const look = await peek.entities.Look.get(data.id).catch(() => null);
    if (!look) return { ok: true };
    const { user, service } = await requireEventMember(context, look.event_id, ["designer"]);
    await requireDesignerOrAdmin(context, look.designer_email);
    if (!isAdmin(user) && look.designer_email?.toLowerCase() !== user.email?.toLowerCase()) {
      throw Object.assign(new Error("You may only manage your own looks"), { status: 403 });
    }
    await service.entities.LookAssignment.deleteMany({ look_id: data.id, event_id: look.event_id });
    await service.entities.Look.delete(data.id);
    return { ok: true };
  });

export const saveAssignment = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      event_id: z.string().min(1),
      look_id: z.string().min(1),
      model_email: email,
      model_name: opt(160),
      status: z.enum(["assigned", "confirmed", "fitted"]).optional(),
      fitting_notes: opt(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    const { service: peek } = await requireUser(context);
    const look = await peek.entities.Look.get(data.look_id);
    if (look.event_id !== data.event_id) throw Object.assign(new Error("Look not found for this event"), { status: 404 });
    const { user, service, membership } = await requireEventMember(context, data.event_id);
    if (!isAdmin(user) && membership?.role !== "backstage_manager") {
      await requireDesignerOrAdmin(context, look.designer_email);
      if (look.designer_email?.toLowerCase() !== user.email?.toLowerCase()) {
        throw Object.assign(new Error("You may only assign models to your own looks"), { status: 403 });
      }
    }
    const modelMembership = await membershipFor(service, { email: data.model_email }, data.event_id);
    if (!modelMembership || modelMembership.role !== "model") {
      throw Object.assign(new Error("Choose a model who belongs to this event"), { status: 400 });
    }
    const { id, ...fields } = data;
    const duplicates = asItems(await service.entities.LookAssignment.filter({
      event_id: data.event_id,
      look_id: data.look_id,
      model_email: data.model_email,
    }));
    if (duplicates.some((row) => row.id !== id)) {
      throw Object.assign(new Error("This model already has this look assigned"), { status: 409 });
    }
    if (id) {
      const previous = await service.entities.LookAssignment.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id || previous.look_id !== data.look_id) {
        throw Object.assign(new Error("Look assignment not found for this event"), { status: 404 });
      }
    }
    const record = id
      ? await service.entities.LookAssignment.update(id, fields)
      : await service.entities.LookAssignment.create(fields);
    await notify(service, {
      eventId: data.event_id,
      emails: [record.model_email],
      title: `New look assigned: ${look.name}`,
      message: "A look has been assigned to you. Review the reference images and styling notes in your lookbook.",
      type: "assignment",
      link: "/lookbook",
    });
    await logAction(service, user, "Assigned look", {
      eventId: data.event_id,
      target: look.name,
      detail: record.model_email,
    });
    return record;
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: peek } = await requireUser(context);
    const assignment = await peek.entities.LookAssignment.get(data.id).catch(() => null);
    if (!assignment) return { ok: true };
    const look = await peek.entities.Look.get(assignment.look_id).catch(() => null);
    if (!look || look.event_id !== assignment.event_id) throw Object.assign(new Error("Look assignment not found"), { status: 404 });
    const { user, service, membership } = await requireEventMember(context, assignment.event_id);
    if (!isAdmin(user) && membership?.role !== "backstage_manager") {
      await requireDesignerOrAdmin(context, look.designer_email);
      if (look.designer_email?.toLowerCase() !== user.email?.toLowerCase()) {
        throw Object.assign(new Error("You may only manage your own look assignments"), { status: 403 });
      }
    }
    await service.entities.LookAssignment.delete(data.id);
    return { ok: true };
  });

export const setAssignmentStatus = createServerFn({ method: "POST" })
  .validator(idOnly.extend({ status: z.enum(["assigned", "confirmed", "fitted"]) }))
  .handler(async ({ data, context }) => {
    const { user, service: lookup } = await requireUser(context);
    const assignment = await lookup.entities.LookAssignment.get(data.id).catch(() => null);
    if (!assignment) throw Object.assign(new Error("Look assignment not found"), { status: 404 });
    const look = await lookup.entities.Look.get(assignment.look_id).catch(() => null);
    if (!look || look.event_id !== assignment.event_id) throw Object.assign(new Error("Look assignment not found"), { status: 404 });
    const { membership } = await requireEventMember(context, assignment.event_id);
    const allowed = isAdmin(user) ||
      (membership?.role === "model" && assignment.model_email?.toLowerCase() === user.email?.toLowerCase()) ||
      (membership?.role === "designer" && look.designer_email?.toLowerCase() === user.email?.toLowerCase()) ||
      membership?.role === "backstage_manager";
    if (!allowed) throw Object.assign(new Error("You do not have permission to update this assignment"), { status: 403 });
    const { service } = await requireEventMember(context, assignment.event_id);
    return service.entities.LookAssignment.update(data.id, { status: data.status });
  });

/* ------------------------------- hair & makeup ----------------------------- */

const hmaSchema = z.object({
  id: z.string().optional(),
  event_id: z.string().min(1),
  model_email: email,
  model_name: opt(160),
  date: z.iso.date(),
  start_time: opt(10),
  end_time: opt(10),
  station: opt(120),
  artist: opt(120),
  instructions: opt(2000),
  reference_images: z.array(z.string().max(2000)).max(6).optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
  notes: opt(2000),
});

export const saveHairMakeup = createServerFn({ method: "POST" })
  .validator(hmaSchema)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireBackstageManager(context, data.event_id);
    const { id, ...fields } = data;
    const modelMembership = await membershipFor(service, { email: data.model_email }, data.event_id);
    if (!modelMembership || modelMembership.role !== "model") {
      throw Object.assign(new Error("Choose a model who belongs to this event"), { status: 400 });
    }
    if (id) {
      const previous = await service.entities.HairMakeup.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id) {
        throw Object.assign(new Error("Appointment not found for this event"), { status: 404 });
      }
    }
    const record = id
      ? await service.entities.HairMakeup.update(id, fields)
      : await service.entities.HairMakeup.create(fields);
    await notify(service, {
      eventId: data.event_id,
      emails: [record.model_email],
      title: id ? "Hair & makeup appointment updated" : "Hair & makeup appointment booked",
      message: `${record.date}${record.start_time ? ` at ${record.start_time}` : ""}${
        record.station ? ` · ${record.station}` : ""
      }`,
      type: "hair_makeup",
      link: "/hair-makeup",
    });
    return record;
  });

export const setHairMakeupStatus = createServerFn({ method: "POST" })
  .validator(idOnly.extend({ status: z.enum(["not_started", "in_progress", "completed"]) }))
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const appointment = await lookup.entities.HairMakeup.get(data.id).catch(() => null);
    if (!appointment) throw Object.assign(new Error("Appointment not found"), { status: 404 });
    const { service } = await requireBackstageManager(context, appointment.event_id);
    return service.entities.HairMakeup.update(data.id, { status: data.status });
  });

export const deleteHairMakeup = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const appointment = await lookup.entities.HairMakeup.get(data.id).catch(() => null);
    if (!appointment) return { ok: true };
    const { service } = await requireBackstageManager(context, appointment.event_id);
    await service.entities.HairMakeup.delete(data.id);
    return { ok: true };
  });

/* -------------------------------- live show -------------------------------- */

const segmentSchema = z.object({
  id: z.string().optional(),
  event_id: z.string().min(1),
  position: z.number().int().min(1).max(500).optional(),
  title: z.string().min(1).max(160),
  designer_name: opt(160),
  collection_name: opt(160),
  model_emails: z.array(z.string().max(200)).max(60).optional(),
  status: z.enum(["pending", "ready", "on_deck", "on_stage", "completed"]).optional(),
  duration_min: z.number().int().min(1).max(180).optional(),
  notes: opt(2000),
});

export const saveSegment = createServerFn({ method: "POST" })
  .validator(segmentSchema)
  .handler(async ({ data, context }) => {
    const { service } = await requireStageManager(context, data.event_id);
    const { id, ...fields } = data;
    const modelEmails = [...new Set((fields.model_emails || []).map((value) => value.trim().toLowerCase()))];
    const memberships = asItems(await service.entities.EventMember.filter({ event_id: data.event_id }));
    const availableModels = new Set(memberships
      .filter((member) => member.role === "model" && member.status !== "removed")
      .map((member) => member.user_email?.toLowerCase()));
    if (modelEmails.some((emailAddress) => !availableModels.has(emailAddress))) {
      throw Object.assign(new Error("Every assigned model must belong to this event"), { status: 400 });
    }
    fields.model_emails = modelEmails;
    if (id) {
      const previous = await service.entities.ShowSegment.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id) {
        throw Object.assign(new Error("Segment not found for this event"), { status: 404 });
      }
    }
    if (!id) {
      const existing = asItems(await service.entities.ShowSegment.filter({ event_id: data.event_id }));
      fields.position = fields.position || existing.length + 1;
    }
    return id
      ? service.entities.ShowSegment.update(id, fields)
      : service.entities.ShowSegment.create(fields);
  });

export const deleteSegment = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const segment = await lookup.entities.ShowSegment.get(data.id).catch(() => null);
    if (!segment) return { ok: true };
    const { service } = await requireStageManager(context, segment.event_id);
    await service.entities.ShowSegment.delete(data.id);
    if (segment.status === "on_stage") {
      await service.entities.Event.update(segment.event_id, { current_segment_id: "", show_status: "idle" });
    }
    return { ok: true };
  });

export const setSegmentStatus = createServerFn({ method: "POST" })
  .validator(
    idOnly.extend({ status: z.enum(["pending", "ready", "on_deck", "on_stage", "completed"]) }),
  )
  .handler(async ({ data, context }) => {
    const { service: peek } = await requireUser(context);
    const segment = await peek.entities.ShowSegment.get(data.id).catch(() => null);
    if (!segment) throw Object.assign(new Error("Segment not found"), { status: 404 });
    const { service, user } = await requireStageManager(context, segment.event_id);

    if (data.status === "on_stage") {
      const rows = asItems(await service.entities.ShowSegment.filter({ event_id: segment.event_id }));
      const live = rows.filter((s) => s.status === "on_stage" && s.id !== segment.id);
      await Promise.all(
        live.map((s) => service.entities.ShowSegment.update(s.id, { status: "completed" })),
      );
      await service.entities.Event.update(segment.event_id, {
        current_segment_id: segment.id,
        show_status: "live",
      });
      await notify(service, {
        eventId: segment.event_id,
        emails: segment.model_emails || [],
        title: `You're on stage: ${segment.title}`,
        message: "Your segment is live. Head to the runway entrance now.",
        type: "show",
        link: "/live",
      });
    }

    const updated = await service.entities.ShowSegment.update(data.id, { status: data.status });
    await logAction(service, user, `Segment marked ${data.status}`, {
      eventId: segment.event_id,
      target: segment.title,
    });
    return updated;
  });

export const advanceShow = createServerFn({ method: "POST" })
  .validator(z.object({ event_id: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const { service, user } = await requireStageManager(context, data.event_id);
    const rows = asItems(
      await service.entities.ShowSegment.filter({ event_id: data.event_id }),
    ).sort((a, b) => (a.position || 0) - (b.position || 0));

    const currentIndex = rows.findIndex((s) => s.status === "on_stage");
    if (currentIndex >= 0) {
      await service.entities.ShowSegment.update(rows[currentIndex].id, { status: "completed" });
    }
    const next = rows.find((s, i) => i > currentIndex && s.status !== "completed" && s.status !== "on_stage");
    if (!next) {
      await service.entities.Event.update(data.event_id, { show_status: "ended", current_segment_id: "" });
      await logAction(service, user, "Show completed", { eventId: data.event_id });
      return { done: true };
    }
    await service.entities.ShowSegment.update(next.id, { status: "on_stage" });
    await service.entities.Event.update(data.event_id, {
      current_segment_id: next.id,
      show_status: "live",
    });
    await notify(service, {
      eventId: data.event_id,
      emails: next.model_emails || [],
      title: `You're on stage: ${next.title}`,
      message: "Your segment is live. Head to the runway entrance now.",
      type: "show",
      link: "/live",
    });
    await logAction(service, user, "Advanced the show", { eventId: data.event_id, target: next.title });
    return { done: false, segment: next };
  });

export const resetShow = createServerFn({ method: "POST" })
  .validator(z.object({ event_id: z.string().min(1) }))
  .handler(async ({ data, context }) => {
    const { service, user } = await requireStageManager(context, data.event_id);
    const rows = asItems(await service.entities.ShowSegment.filter({ event_id: data.event_id }));
    await Promise.all(
      rows.map((s) =>
        service.entities.ShowSegment.update(s.id, {
          status: s.status === "ready" ? "ready" : "pending",
        }),
      ),
    );
    await service.entities.Event.update(data.event_id, {
      show_status: "idle",
      current_segment_id: "",
    });
    await logAction(service, user, "Reset show progress", { eventId: data.event_id });
    return { ok: true };
  });

/* ------------------------------ announcements ------------------------------ */

export const sendAnnouncement = createServerFn({ method: "POST" })
  .validator(
    z.object({
      event_id: z.string().min(1),
      title: z.string().min(1).max(160),
      message: z.string().min(1).max(2000),
      audience: z.enum(["all", "models", "designers"]),
      pinned: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireOperationsManager(context, data.event_id);
    const record = await service.entities.Announcement.create({
      ...data,
      pinned: data.pinned || false,
      author_name: user.full_name || user.email,
    });
    await notify(service, {
      eventId: data.event_id,
      emails: await eventAudience(service, data.event_id, data.audience),
      title: data.title,
      message: data.message,
      type: "announcement",
      link: "/notifications",
    });
    await logAction(service, user, "Sent announcement", {
      eventId: data.event_id,
      target: data.title,
      detail: data.audience,
    });
    return record;
  });

/* ------------------------------- notifications ----------------------------- */

export const markNotificationRead = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireUser(context);
    const record = await service.entities.Notification.get(data.id).catch(() => null);
    if (!record) return { ok: true };
    if (record.user_email !== user.email && !isAdmin(user))
      throw Object.assign(new Error("Forbidden"), { status: 403 });
    await service.entities.Notification.update(data.id, { read: true });
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" }).handler(
  async ({ context }) => {
    const { user, service } = await requireUser(context);
    await service.entities.Notification.updateMany(
      { user_email: user.email, read: false },
      { $set: { read: true } },
    );
    return { ok: true };
  },
);

/* ------------------------------- opportunities ----------------------------- */

const opportunitySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1).max(160),
  description: opt(4000),
  organization: opt(160),
  event_id: opt(80),
  requirements: opt(2000),
  deadline: z.iso.date().optional(),
  status: z.enum(["open", "closed", "archived"]).optional(),
  instructions: opt(2000),
  contact: opt(200),
  applications_enabled: z.boolean().optional(),
});

export const saveOpportunity = createServerFn({ method: "POST" })
  .validator(opportunitySchema)
  .handler(async ({ data, context }) => {
    const { user, service } = await requireAdmin(context);
    const { id, ...fields } = data;
    if (fields.event_id) {
      const event = await service.entities.Event.get(fields.event_id).catch(() => null);
      if (!event) throw Object.assign(new Error("Event not found"), { status: 404 });
    }
    const record = id
      ? await service.entities.Opportunity.update(id, fields)
      : await service.entities.Opportunity.create(fields);
    await logAction(service, user, id ? "Updated opportunity" : "Created opportunity", {
      target: record.title,
    });
    if (!id) {
      await notify(service, {
        emails: await adminEmails(service),
        title: "New opportunity published",
        message: record.title,
        type: "opportunity",
        link: "/opportunities",
      });
    }
    return record;
  });

export const deleteOpportunity = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { service } = await requireUser(context);
    await service.entities.Application.deleteMany({ opportunity_id: data.id });
    await service.entities.Opportunity.delete(data.id);
    return { ok: true };
  });

export const applyToOpportunity = createServerFn({ method: "POST" })
  .validator(
    z.object({
      opportunity_id: z.string().min(1),
      message: z.string().min(1).max(2000),
      portfolio_url: opt(2000),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireUser(context);
    const opportunity = await service.entities.Opportunity.get(data.opportunity_id);
    if (opportunity.status !== "open" || !opportunity.applications_enabled)
      throw Object.assign(new Error("Applications are closed for this opportunity"), { status: 400 });
    const existing = asItems(
      await service.entities.Application.filter({
        opportunity_id: data.opportunity_id,
        user_email: user.email,
      }),
    );
    if (existing.length)
      throw Object.assign(new Error("You have already applied to this opportunity"), { status: 400 });
    let record;
    try {
      record = await service.entities.Application.create({
        opportunity_id: data.opportunity_id,
        opportunity_title: opportunity.title,
        user_email: user.email,
        full_name: user.full_name || user.email,
        message: data.message,
        portfolio_url: data.portfolio_url || "",
        status: "submitted",
      });
    } catch (error) {
      if (error?.code === "23505") throw Object.assign(new Error("You have already applied to this opportunity"), { status: 409 });
      throw error;
    }
    await notify(service, {
      emails: [user.email, ...(await adminEmails(service))],
      title: `Application submitted: ${opportunity.title}`,
      message: `${user.full_name || user.email} applied.`,
      type: "opportunity",
      link: "/opportunities",
    });
    return record;
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .validator(
    idOnly.extend({
      status: z.enum(["submitted", "reviewing", "accepted", "declined"]),
      admin_notes: z.string().max(2000).optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireAdmin(context);
    const record = await service.entities.Application.update(data.id, {
      status: data.status,
      admin_notes: data.admin_notes || "",
    });
    await notify(service, {
      emails: [record.user_email],
      title: `Application ${data.status}: ${record.opportunity_title}`,
      message:
        data.status === "accepted"
          ? "Congratulations — your application has been accepted. The team will be in touch."
          : data.status === "declined"
            ? "Thank you for applying. This application was not selected."
            : "Your application is being reviewed.",
      type: "opportunity",
      link: "/opportunities",
    });
    await logAction(service, user, `Application ${data.status}`, { target: record.opportunity_title });
    return record;
  });

/* ---------------------------------- tasks ---------------------------------- */

export const saveTask = createServerFn({ method: "POST" })
  .validator(
    z.object({
      id: z.string().optional(),
      event_id: z.string().min(1),
      user_email: email,
      title: z.string().min(1).max(200),
      kind: z.enum(["acknowledgement", "prep", "fitting", "wardrobe"]).optional(),
      due_date: z.iso.date().optional(),
      done: z.boolean().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { service } = await requireBackstageManager(context, data.event_id);
    const { id, ...fields } = data;
    const modelMembership = await membershipFor(service, { email: data.user_email }, data.event_id);
    if (!modelMembership || modelMembership.role !== "model") {
      throw Object.assign(new Error("Choose a model who belongs to this event"), { status: 400 });
    }
    if (id) {
      const previous = await service.entities.ReadinessTask.get(id).catch(() => null);
      if (!previous || previous.event_id !== data.event_id) {
        throw Object.assign(new Error("Readiness task not found for this event"), { status: 404 });
      }
    }
    const record = id
      ? await service.entities.ReadinessTask.update(id, fields)
      : await service.entities.ReadinessTask.create(fields);
    if (!id) {
      await notify(service, {
        eventId: data.event_id,
        emails: [record.user_email],
        title: "New task for you",
        message: record.title,
        type: "general",
        link: "/",
      });
    }
    return record;
  });

export const deleteTask = createServerFn({ method: "POST" })
  .validator(idOnly)
  .handler(async ({ data, context }) => {
    const { service: lookup } = await requireUser(context);
    const task = await lookup.entities.ReadinessTask.get(data.id).catch(() => null);
    if (!task) return { ok: true };
    const { service } = await requireBackstageManager(context, task.event_id);
    await service.entities.ReadinessTask.delete(data.id);
    return { ok: true };
  });

/* --------------------------------- profile --------------------------------- */

export const updateProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      full_name: z.string().min(1).max(160).optional(),
      phone: opt(40),
      city: opt(120),
      bio: opt(2000),
      brand_name: opt(160),
      website: opt(300),
      instagram: opt(160),
      avatar_url: opt(2000),
      height: opt(40),
      bust: opt(40),
      waist: opt(40),
      hips: opt(40),
      shoe_size: opt(20),
      hair_color: opt(60),
      eye_color: opt(60),
      emergency_contact: opt(160),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireUser(context);
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
    const updated = await service.entities.User.update(user.id, clean);
    return { ...user, ...clean, ...updated };
  });

export const saveDesignerProfile = createServerFn({ method: "POST" })
  .validator(
    z.object({
      brand_name: opt(160),
      bio: opt(2000),
      logo_url: opt(2000),
      website: opt(300),
      instagram: opt(160),
    }),
  )
  .handler(async ({ data, context }) => {
    const { user, service } = await requireUser(context);
    const existing = asItems(
      await service.entities.DesignerProfile.filter({ user_email: user.email }),
    );
    const payload = { ...data, user_email: user.email, full_name: user.full_name || user.email };
    return existing[0]
      ? service.entities.DesignerProfile.update(existing[0].id, payload)
      : service.entities.DesignerProfile.create(payload);
  });
