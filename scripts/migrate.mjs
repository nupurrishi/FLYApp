import { error as logError, log } from "node:console";
import process from "node:process";
import { URL } from "node:url";
import { readFile } from "node:fs/promises";
import { getMigrations } from "better-auth/db/migration";
import { getAuth } from "../src/lib/auth.server.js";
import { closePool, getPool } from "../src/lib/db.server.js";

try {
  const { runMigrations } = await getMigrations(getAuth().options);
  await runMigrations();
  const schema = await readFile(new URL("../migrations/0001_flyapp.sql", import.meta.url), "utf8");
  await getPool().query(schema);
  log("Database migrations completed.");
} catch (error) {
  logError("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
