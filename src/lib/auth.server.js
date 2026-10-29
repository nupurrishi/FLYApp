import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getPool } from "./db.server.js";
import { sendAccountEmail } from "./mail.server.js";

const baseURL = () => process.env.BETTER_AUTH_URL || "http://localhost:5173";
const production = () => process.env.NODE_ENV === "production";
let auth;

export function getAuth() {
  if (auth) return auth;
  if (production() && (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32)) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters in production");
  }
  if (production() && !process.env.BETTER_AUTH_URL?.startsWith("https://")) {
    throw new Error("BETTER_AUTH_URL must be configured with HTTPS in production");
  }
  auth = betterAuth({
  appName: "FLYApp",
  baseURL: baseURL(),
  secret: process.env.BETTER_AUTH_SECRET || "local-development-only-change-this-secret-32chars",
  database: getPool(),
  trustedOrigins: [...new Set([
    baseURL(),
    ...(production() ? [] : ["http://localhost:5173", "http://localhost:3000"]),
  ])],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) =>
      sendAccountEmail({ to: user.email, subject: "Reset your FLYApp password", url, intro: "Use this link to reset your password." }),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) =>
      sendAccountEmail({ to: user.email, subject: "Verify your FLYApp email", url, intro: "Verify your email address to access FLYApp." }),
  },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "user", input: false },
      full_name: { type: "string", required: false, input: false },
      phone: { type: "string", required: false, input: false },
      city: { type: "string", required: false, input: false },
      avatar_url: { type: "string", required: false, input: false },
      bio: { type: "string", required: false, input: false },
      brand_name: { type: "string", required: false, input: false },
      website: { type: "string", required: false, input: false },
      instagram: { type: "string", required: false, input: false },
      height: { type: "string", required: false, input: false },
      bust: { type: "string", required: false, input: false },
      waist: { type: "string", required: false, input: false },
      hips: { type: "string", required: false, input: false },
      shoe_size: { type: "string", required: false, input: false },
      hair_color: { type: "string", required: false, input: false },
      eye_color: { type: "string", required: false, input: false },
      emergency_contact: { type: "string", required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, full_name: user.full_name || user.name } }),
      },
    },
  },
  advanced: {
    useSecureCookies: production(),
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: production() },
  },
  plugins: [tanstackStartCookies()],
  });
  return auth;
}
