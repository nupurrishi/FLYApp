/**
 * FLYApp Google Apps Script connection.
 *
 * At this stage the Apps Script deployment exposes a health/status endpoint only.
 * It does not yet provide authenticated reads or writes, so do not use this helper
 * for user data until the Apps Script API has been implemented and secured.
 */

const backendUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEB_APP_URL?.trim();

export async function checkGoogleSheetsBackend() {
  if (!backendUrl) {
    throw new Error(
      "Google Sheets backend URL is not configured. Set VITE_GOOGLE_SHEETS_WEB_APP_URL."
    );
  }

  let response;

  try {
    response = await fetch(backendUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error(
      "Could not reach the Google Sheets test backend. Check the deployment URL and network connection."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Google Sheets test backend returned HTTP ${response.status}.`
    );
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error("Google Sheets test backend returned an invalid response.");
  }

  if (payload?.app !== "FLYApp" || payload?.status !== "connected") {
    throw new Error("Google Sheets test backend did not return the expected status.");
  }

  return payload;
}
