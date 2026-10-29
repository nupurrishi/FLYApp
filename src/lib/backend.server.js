import { randomUUID } from "node:crypto";
import { getPool } from "./db.server.js";

const ENTITY_NAMES = [
  "Announcement", "Application", "AuditLog", "Collection", "DesignerProfile", "Event",
  "EventMember", "HairMakeup", "Look", "LookAssignment", "Notification", "Opportunity",
  "ReadinessTask", "ScheduleItem", "ShowSegment",
];
const CAP = 500;
const PROFILE_FIELDS = new Set([
  "full_name", "phone", "city", "avatar_url", "bio", "brand_name", "website", "instagram",
  "height", "bust", "waist", "hips", "shoe_size", "hair_color", "eye_color", "emergency_contact",
]);
const mutableData = (value = {}) => Object.fromEntries(
  Object.entries(value).filter(([key]) => !["id", "created_date", "updated_date"].includes(key)),
);

const userRecord = (row) => row && ({ ...row, full_name: row.full_name || row.name || row.email });

function safeSort(sort) {
  if (typeof sort !== "string" || !sort) return null;
  const descending = sort.startsWith("-");
  const field = (descending ? sort.slice(1) : sort).replace(/[^a-zA-Z0-9_]/g, "");
  if (!field) return null;
  return { field, direction: descending ? "DESC" : "ASC" };
}

function resultLimit(options, fallback = 100) {
  const value = typeof options === "number" ? options : options?.limit;
  return Math.max(1, Math.min(CAP, Number.isInteger(value) ? value : fallback));
}

function optionsFor(sortOrOptions, limit) {
  if (typeof sortOrOptions === "string") return { sort: sortOrOptions, limit };
  return { ...(sortOrOptions || {}), limit: sortOrOptions?.limit ?? limit };
}

async function userRows(method, params = {}) {
  const pool = getPool();
  if (method === "get") {
    const { rows } = await pool.query('SELECT * FROM "user" WHERE id = $1', [params.id]);
    return userRecord(rows[0] || null);
  }
  const limit = resultLimit(params);
  const { rows } = await pool.query('SELECT * FROM "user" ORDER BY "createdAt" DESC LIMIT $1', [limit]);
  return rows.map(userRecord);
}

function createEntity(name) {
  if (name === "User") {
    return {
      get: (id) => userRows("get", { id }),
      list: (options) => userRows("list", options),
      async update(id, changes) {
        const fields = Object.fromEntries(Object.entries(changes || {}).filter(([key]) => PROFILE_FIELDS.has(key)));
        if (!Object.keys(fields).length) return userRows("get", { id });
        const columns = Object.keys(fields).map((field, index) => `"${field}" = $${index + 2}`).join(", ");
        const { rows } = await getPool().query(`UPDATE "user" SET ${columns}, "updatedAt" = now() WHERE id = $1 RETURNING *`, [id, ...Object.values(fields)]);
        return userRecord(rows[0] || null);
      },
    };
  }
  return {
    async get(id) {
      const { rows } = await getPool().query(
        "SELECT data FROM flyapp_records WHERE entity = $1 AND id = $2",
        [name, id],
      );
      return rows[0]?.data ?? null;
    },
    async list(sortOrOptions = {}) {
      const opts = optionsFor(sortOrOptions);
      const sort = safeSort(opts.sort);
      const order = sort ? `ORDER BY data->>'${sort.field}' ${sort.direction} NULLS LAST` : "ORDER BY created_at DESC";
      const { rows } = await getPool().query(
        `SELECT data FROM flyapp_records WHERE entity = $1 ${order} LIMIT $2`,
        [name, resultLimit(opts)],
      );
      return rows.map((row) => row.data);
    },
    async filter(filters = {}, sortOrOptions = {}, limit) {
      const opts = optionsFor(sortOrOptions, limit);
      const sort = safeSort(opts.sort);
      const order = sort ? `ORDER BY data->>'${sort.field}' ${sort.direction} NULLS LAST` : "ORDER BY created_at DESC";
      const { rows } = await getPool().query(
        `SELECT data FROM flyapp_records WHERE entity = $1 AND data @> $2::jsonb ${order} LIMIT $3`,
        [name, JSON.stringify(filters || {}), resultLimit(opts)],
      );
      return rows.map((row) => row.data);
    },
    async create(input) {
      const now = new Date().toISOString();
      const data = { ...input, id: input.id || randomUUID(), created_date: input.created_date || now, updated_date: now };
      await getPool().query(
        "INSERT INTO flyapp_records(entity, id, data) VALUES($1, $2, $3::jsonb)",
        [name, data.id, JSON.stringify(data)],
      );
      return data;
    },
    async bulkCreate(inputs) {
      if (!Array.isArray(inputs) || inputs.length > CAP) throw new Error("Bulk record limit exceeded");
      const client = await getPool().connect();
      try {
        await client.query("BEGIN");
        const output = [];
        for (const input of inputs) {
          const now = new Date().toISOString();
          const data = { ...input, id: input.id || randomUUID(), created_date: input.created_date || now, updated_date: now };
          await client.query(
            "INSERT INTO flyapp_records(entity, id, data) VALUES($1, $2, $3::jsonb)",
            [name, data.id, JSON.stringify(data)],
          );
          output.push(data);
        }
        await client.query("COMMIT");
        return output;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async update(id, changes) {
      const patch = mutableData(changes);
      const { rows } = await getPool().query(
        `UPDATE flyapp_records
         SET data = data || $3::jsonb || jsonb_build_object('updated_date', now()::text), updated_at = now()
         WHERE entity = $1 AND id = $2 RETURNING data`,
        [name, id, JSON.stringify(patch)],
      );
      return rows[0]?.data ?? null;
    },
    async delete(id) {
      await getPool().query("DELETE FROM flyapp_records WHERE entity = $1 AND id = $2", [name, id]);
      return { ok: true };
    },
    async deleteMany(filters = {}) {
      const { rowCount } = await getPool().query(
        "DELETE FROM flyapp_records WHERE entity = $1 AND data @> $2::jsonb",
        [name, JSON.stringify(filters || {})],
      );
      return { deleted: rowCount };
    },
    async updateMany(filters = {}, operation = {}) {
      const changes = mutableData(operation.$set || operation);
      const { rowCount } = await getPool().query(
        `UPDATE flyapp_records
         SET data = data || $3::jsonb || jsonb_build_object('updated_date', now()::text), updated_at = now()
         WHERE entity = $1 AND data @> $2::jsonb`,
        [name, JSON.stringify(filters || {}), JSON.stringify(changes)],
      );
      return { updated: rowCount };
    },
  };
}

let entities;
export function getEntityService() {
  entities ??= Object.fromEntries([...ENTITY_NAMES, "User"].map((name) => [name, createEntity(name)]));
  return { entities };
}
