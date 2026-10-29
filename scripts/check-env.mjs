import { error } from "node:console";
import process from "node:process";
import { URL } from "node:url";

const errors = [];
const production = process.env.NODE_ENV === "production";
if (!process.env.DATABASE_URL) errors.push("DATABASE_URL is required");
if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
  errors.push("BETTER_AUTH_SECRET must contain at least 32 characters");
}
try {
  const url = new URL(process.env.BETTER_AUTH_URL || "");
  if (production && url.protocol !== "https:") errors.push("BETTER_AUTH_URL must use https in production");
} catch {
  errors.push("BETTER_AUTH_URL must be an absolute URL");
}
if (production && (!process.env.SMTP_FROM || !(process.env.SMTP_URL || process.env.SMTP_HOST))) {
  errors.push("Configure SMTP_URL or SMTP_HOST and SMTP_FROM to enable account verification and password reset");
}
if (errors.length) {
  error(`FLYApp configuration is incomplete:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
