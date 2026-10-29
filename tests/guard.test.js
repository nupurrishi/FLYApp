import assert from "node:assert/strict";
import test from "node:test";
import {
  membershipFor,
  requireBackstageManager,
  requireEventMember,
  requireStageManager,
  requireUser,
} from "../src/lib/guard.server.js";

function context({ user, memberships = [], events = ["event-1"] }) {
  const service = {
    entities: {
      Event: { get: async (id) => (events.includes(id) ? { id } : null) },
      EventMember: {
        filter: async ({ event_id, user_email }) => memberships.filter(
          (row) => row.event_id === event_id && row.user_email === user_email,
        ),
      },
    },
  };
  return { getSession: async () => user ? { user } : null, service };
}

const member = (role, status = "active") => ({
  event_id: "event-1",
  user_email: "person@example.com",
  role,
  status,
});

test("rejects an anonymous visitor", async () => {
  await assert.rejects(requireUser(context({ user: null })), { status: 401 });
});

test("a removed member cannot access an event", async () => {
  await assert.rejects(
    requireEventMember(context({ user: { id: "u1", email: "person@example.com" }, memberships: [member("model", "removed")] }), "event-1"),
    { status: 403 },
  );
});

test("a stage manager can access their event but not backstage tools", async () => {
  const ctx = context({ user: { id: "u1", email: "person@example.com" }, memberships: [member("stage_manager")] });
  const allowed = await requireStageManager(ctx, "event-1");
  assert.equal(allowed.membership.role, "stage_manager");
  await assert.rejects(requireBackstageManager(ctx, "event-1"), { status: 403 });
});

test("rejects membership checks for a different or missing event", async () => {
  const ctx = context({ user: { id: "u1", email: "person@example.com" }, memberships: [member("model")] });
  await assert.rejects(requireEventMember(ctx, "event-2"), { status: 404 });
  await assert.rejects(requireEventMember(ctx, "event-1", ["designer"]), { status: 403 });
});

test("ignores a removed duplicate when finding an active membership", async () => {
  const rows = [member("model", "removed"), member("designer", "active")];
  const service = { entities: { EventMember: { filter: async () => rows } } };
  assert.equal((await membershipFor(service, { email: "person@example.com" }, "event-1")).role, "designer");
});

test("an authenticated administrator has event access without an event membership", async () => {
  const result = await requireEventMember(context({ user: { id: "admin", email: "admin@example.com", role: "admin" } }), "event-1");
  assert.equal(result.membership, null);
});
