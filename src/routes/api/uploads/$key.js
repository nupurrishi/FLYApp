import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { getPool } from "@/lib/db.server";
import { requireEventMember, requireUser } from "@/lib/guard.server";

const uploadDir = () => process.env.UPLOAD_DIR || "./data/uploads";

export const Route = createFileRoute("/api/uploads/$key")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const key = String(params.key || "");
          if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/.test(key)) return new Response("Not found", { status: 404 });
          const { user } = await requireUser({ request });
          const { rows } = await getPool().query("SELECT * FROM flyapp_uploads WHERE key = $1", [key]);
          const upload = rows[0];
          if (!upload) return new Response("Not found", { status: 404 });
          if (upload.event_id) {
            await requireEventMember({ request }, upload.event_id);
          } else if (upload.owner_user_id !== user.id) {
            return new Response("Not found", { status: 404 });
          }
          const body = await readFile(join(uploadDir(), key));
          return new Response(body, {
            headers: {
              "Content-Type": upload.mime_type,
              "Content-Length": String(body.byteLength),
              "Cache-Control": "private, no-store",
              "X-Content-Type-Options": "nosniff",
              "Content-Disposition": "inline",
            },
          });
        } catch (error) {
          const status = error?.status === 401 || error?.status === 403 ? error.status : 404;
          return new Response(status === 401 ? "Unauthorized" : "Not found", { status });
        }
      },
    },
  },
});
