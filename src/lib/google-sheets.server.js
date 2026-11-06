import { env } from "cloudflare:workers";

// This module runs only on the Cloudflare server. Never import it into browser components.
const ENDPOINT_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;

function getConfig() {
  const endpoint = env.FLYAPP_SHEETS_WEB_APP_URL;
  const key = env.FLYAPP_API_KEY;
  if (!endpoint || !key) {
    throw new Error("Google Sheets backend is not configured. Set FLYAPP_SHEETS_WEB_APP_URL and FLYAPP_API_KEY as server-side secrets.");
  }
  if (!ENDPOINT_PATTERN.test(endpoint)) {
    throw new Error("FLYAPP_SHEETS_WEB_APP_URL must be the deployed Apps Script /exec URL.");
  }
  return { endpoint, key };
}

// Send every action as POST so the private API key is not placed in a URL/query string.
async function requestSheets({ action, payload = {} }) {
  const { endpoint, key } = getConfig();
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, key, ...payload }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || `Google Sheets backend returned HTTP ${response.status}`);
  }
  return result.data;
}

export async function listSheetEvents() {
  const rows = await requestSheets({ action: "listEvents" });
  return Array.isArray(rows) ? rows : [];
}

export async function createSheetEvent(event) {
  return requestSheets({
    action: "createEvent",
    payload: { event: {
      event_name: String(event.event_name || "").trim(),
      event_date: String(event.event_date || ""),
      location: String(event.location || ""),
      status: String(event.status || "planning"),
    } },
  });
}

// Generic server-only data helpers for the migration from Base44 to Sheets.
export async function listSheetRecords(entity, eventId) {
  const rows = await requestSheets({ action: "listRecords", payload: { entity, event_id: eventId || "" } });
  return Array.isArray(rows) ? rows : [];
}

export async function createSheetRecord(entity, record) {
  return requestSheets({ action: "createRecord", payload: { entity, record } });
}

export async function updateSheetRecord(entity, id, record) {
  return requestSheets({ action: "updateRecord", payload: { entity, id, record } });
}

export async function deleteSheetRecord(entity, id) {
  return requestSheets({ action: "deleteRecord", payload: { entity, id } });
}
