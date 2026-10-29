import { createFileRoute } from "@tanstack/react-router";

// A small no-cache server clock endpoint used for diagnostics.
export const Route = createFileRoute("/api/time")({
  server: {
    handlers: {
      GET: async () => Response.json({ now: new Date().toISOString() }, { headers: { "cache-control": "no-store" } }),
    },
  },
});
