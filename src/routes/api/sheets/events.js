import { env } from "cloudflare:workers";
import { createFileRoute } from "@tanstack/react-router";
import { createSheetEvent, listSheetEvents } from "@/lib/google-sheets.server";

const unauthorized = () =>
  Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });

function hasTestAccess(request) {
  const expected = env.FLYAPP_TEST_ACCESS_TOKEN;
  const provided = request.headers.get("x-flyapp-test-token") || "";
  if (!expected || !provided || expected.length !== provided.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}

export const Route = createFileRoute("/api/sheets/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!hasTestAccess(request)) return unauthorized();

        try {
          const events = await listSheetEvents();
          return Response.json(
            { ok: true, data: events },
            { headers: { "cache-control": "no-store" } },
          );
        } catch (error) {
          return Response.json(
            { ok: false, error: error.message || "Could not read Google Sheets events" },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }
      },
      POST: async ({ request }) => {
        if (!hasTestAccess(request)) return unauthorized();

        let body;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Request body must be valid JSON" }, { status: 400 });
        }

        const event = body?.event;
        if (!event || typeof event.event_name !== "string" || !event.event_name.trim()) {
          return Response.json({ ok: false, error: "event.event_name is required" }, { status: 400 });
        }

        try {
          const created = await createSheetEvent(event);
          return Response.json({ ok: true, data: created }, { status: 201 });
        } catch (error) {
          return Response.json(
            { ok: false, error: error.message || "Could not create Google Sheets event" },
            { status: 502 },
          );
        }
      },
    },
  },
});
