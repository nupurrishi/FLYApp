/**
 * Server-only Google Sheets mirror for FLYApp event creation.
 *
 * Configure these in the Codespaces terminal environment (not in VITE_* vars):
 *   FLYAPP_SHEETS_WEB_APP_URL = deployed Apps Script URL ending in /exec
 *   FLYAPP_API_KEY = the same secret configured in Apps Script Script Properties
 *
 * Base44 remains the primary data store. This helper only mirrors newly created
 * events to the test spreadsheet; it never reads the key from browser input.
 */
export async function mirrorEventToGoogleSheets(event) {
  const env = typeof process !== "undefined" ? process.env : {};
  const endpoint = env.FLYAPP_SHEETS_WEB_APP_URL;
  const key = env.FLYAPP_API_KEY;

  if (!endpoint || !key) {
    console.info(
      "[FLYApp] Google Sheets mirror skipped: server environment secrets are not configured.",
    );
    return { ok: false, skipped: true };
  }

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/.test(endpoint)) {
    throw new Error("FLYAPP_SHEETS_WEB_APP_URL must be the deployed Apps Script /exec URL.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "createEvent",
      key,
      event: {
        event_name: event.name,
        event_date: event.start_date,
        location: [event.venue_name, event.city].filter(Boolean).join(", ") || event.venue_address || "",
        status: event.status || "planning",
      },
    }),
    redirect: "follow",
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `Google Sheets returned HTTP ${response.status}`);
  }

  console.info("[FLYApp] New event mirrored to Google Sheets:", result.data?.event_id);
  return result.data;
}
