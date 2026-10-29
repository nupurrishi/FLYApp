import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createFileRoute } from "@tanstack/react-router";
import { getPool } from "@/lib/db.server";
import { requireBackstageManager, requireEventMember, requireUser } from "@/lib/guard.server";

const MAX_BYTES = 8 * 1024 * 1024;
const EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"], ["image/png", ".png"], ["image/webp", ".webp"], ["image/avif", ".avif"],
]);
const uploadDir = () => process.env.UPLOAD_DIR || "./data/uploads";

function matchesMime(buffer, mime) {
  if (mime === "image/jpeg") return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp") return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (mime === "image/avif") return buffer.toString("ascii", 4, 8) === "ftyp" && /^(avif|avis)$/.test(buffer.toString("ascii", 8, 12));
  return false;
}

export const Route = createFileRoute("/api/uploads/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const origin = request.headers.get("origin");
          const trustedOrigin = new URL(process.env.BETTER_AUTH_URL || request.url).origin;
          if (!origin || origin !== trustedOrigin) return Response.json({ error: "Invalid request origin" }, { status: 403 });
          const form = await request.formData();
          const file = form.get("file");
          const eventId = String(form.get("event_id") || "");
          const { user } = eventId
            ? await requireBackstageManager({ request }, eventId).catch(async (error) => {
                if (error?.status === 403) return requireEventMember({ request }, eventId, ["designer"]);
                throw error;
              })
            : await requireUser({ request });

          if (!file || typeof file.arrayBuffer !== "function") return Response.json({ error: "Choose an image file" }, { status: 400 });
          if (file.size < 1 || file.size > MAX_BYTES) return Response.json({ error: "Image must be between 1 byte and 8 MB" }, { status: 413 });
          const extension = EXTENSIONS.get(file.type);
          if (!extension) return Response.json({ error: "Use a JPG, PNG, WebP, or AVIF image" }, { status: 415 });
          const bytes = Buffer.from(await file.arrayBuffer());
          if (!matchesMime(bytes, file.type)) return Response.json({ error: "The selected file does not match its image type" }, { status: 415 });

          const key = `${randomUUID()}${extension}`;
          await mkdir(uploadDir(), { recursive: true });
          await writeFile(join(uploadDir(), key), bytes, { flag: "wx", mode: 0o640 });
          try {
            await getPool().query(
              "INSERT INTO flyapp_uploads(key, owner_user_id, event_id, mime_type, original_name) VALUES($1, $2, $3, $4, $5)",
              [key, user.id, eventId || null, file.type, String(file.name || "image").slice(0, 200)],
            );
          } catch (error) {
            const { unlink } = await import("node:fs/promises");
            await unlink(join(uploadDir(), key)).catch(() => {});
            throw error;
          }
          return Response.json({ file_url: `/api/uploads/${key}` }, { status: 201 });
        } catch (error) {
          const status = error?.status === 401 || error?.status === 403 ? error.status : 500;
          return Response.json({ error: status === 500 ? "Upload failed. Try again." : error.message }, { status });
        }
      },
    },
  },
});
