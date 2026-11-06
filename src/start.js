import { createStart } from "@tanstack/react-start";
import { authMiddleware, base44RequestMiddleware } from "@/lib/auth-middleware";
import { errorCaptureFunctionMiddleware, errorCaptureRequestMiddleware } from "@/lib/error-capture";

// Server functions and routes receive Supabase-authenticated identity and a Sheets-backed data facade.
// Error capture runs first so it records authentication and data-handler failures.
export const startInstance = createStart(() => ({
  requestMiddleware: [errorCaptureRequestMiddleware, base44RequestMiddleware],
  functionMiddleware: [errorCaptureFunctionMiddleware, authMiddleware],
}));
