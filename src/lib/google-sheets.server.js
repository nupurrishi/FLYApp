import { env } from "cloudflare:workers";

const ENDPOINT_PATTERN = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;

function getConfig() {
  const endpoint = env.FLYAPP_SHEETS_WEB_APP_URL;
  const key = env.FLYAPP_API_KEY;

  if (!endpoint || !key) {
    throw new Error(
      "Google Sheets backend is not configured. Set FLYAPP_SHEETS_WEB_APP_URL and FLYAPP_API_KEY as server-side secrets.",
    );
  }

  if (!ENDPOINT_PATTERN.test(endpoint)) {
    throw new Error("FLYAPP_SHEETS_WEB_APP_URL must be the deployed Apps Script /exec URL.");
  }

  return { endpoint, key };
}

async function requestSheets({ method = "GET", action, payload = {} }) {
  const { endpoint, key } = getConfig();
  const url = new URL(endpoint);
  const init = { method, redirect: "follow" };

  if (method === "GET") {
    url.searchParams.set("action", action);
    url.searchParams.set("key", key);
  } else {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify({ action, key, ...payload });
  }

  const response = await fetch(url, init);
  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    const message = result?.error || `Google Sheets backend returned HTTP ${response.status}`;
    throw new Error(message);
  }

  return result.data;
}

export async function listSheetEvents() {
  const rows = await requestSheets({ action: "listEvents" });
  return Array.isArray(rows) ? rows : [];
}

export async function createSheetEvent(event) {
  return requestSheets({
    method: "POST",
    action: "createEvent",
    payload: {
      event: {
        event_name: String(event.event_name || "").trim(),
        event_date: String(event.event_date || ""),
        location: String(event.location || ""),
        status: String(event.status || "planning"),
      },
    },
  });
}
