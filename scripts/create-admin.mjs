import { error as logError, log } from "node:console";
import process from "node:process";
import { closePool, getPool } from "../src/lib/db.server.js";

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  logError("Usage: pnpm admin:create verified-account@example.com");
  process.exitCode = 2;
} else {
  try {
    const pool = getPool();
    const existingAdmins = await pool.query('SELECT count(*)::int AS count FROM "user" WHERE role = $1', ["admin"]);
    if (existingAdmins.rows[0].count > 0) throw new Error("An administrator already exists. Ask an existing admin to grant additional access.");
    const result = await pool.query('UPDATE "user" SET role = $2, "updatedAt" = now() WHERE lower(email) = $1 AND "emailVerified" = true RETURNING id, email', [email, "admin"]);
    if (!result.rowCount) throw new Error("No verified account with that email was found. Register and verify it first.");
    log(`Initial administrator enabled for ${result.rows[0].email}.`);
  } catch (error) {
    logError(`Administrator setup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
