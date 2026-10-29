/**
 * FLYApp Google Sheets test API.
 *
 * Configure Script Properties (Project Settings > Script properties):
 *   FLYAPP_API_KEY = a long random secret
 *   FLYAPP_SPREADSHEET_ID = the spreadsheet ID from the Google Sheets URL
 *
 * Keep FLYAPP_API_KEY server-side. Never put it in a VITE_* variable or browser code.
 */

const SHEET_HEADERS = {
  Users: ["user_id", "email", "full_name", "role", "status", "created_at"],
  Events: ["event_id", "event_name", "event_date", "location", "status", "created_at"],
  Schedules: ["schedule_id", "event_id", "title", "start_time", "end_time", "location", "notes"],
  Assignments: ["assignment_id", "event_id", "schedule_id", "user_id", "role", "status"],
};

function setupFlyAppSheets() {
  const spreadsheet = getSpreadsheet_();
  Object.entries(SHEET_HEADERS).forEach(([name, headers]) => {
    let sheet = spreadsheet.getSheetByName(name);
    if (!sheet) sheet = spreadsheet.insertSheet(name);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
  return { ok: true, message: "FLYApp sheet tabs and headers are ready." };
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const action = String(params.action || "health");

  if (action === "health") {
    return json_({ app: "FLYApp", status: "connected", message: "FLYApp test backend is running" });
  }

  if (!authorized_(params.key)) return json_({ ok: false, error: "Unauthorized" });

  try {
    if (action === "listEvents") return json_({ ok: true, data: readRows_("Events") });
    if (action === "listSchedules") {
      const eventId = String(params.event_id || "");
      const rows = readRows_("Schedules");
      return json_({ ok: true, data: eventId ? rows.filter((row) => String(row.event_id) === eventId) : rows });
    }
    return json_({ ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("FLYApp GET action failed", error);
    return json_({ ok: false, error: "Backend request failed" });
  }
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (_) {
    return json_({ ok: false, error: "Invalid JSON body" });
  }

  if (!authorized_(body.key)) return json_({ ok: false, error: "Unauthorized" });

  try {
    if (body.action === "createEvent") {
      const input = body.event || {};
      const name = String(input.event_name || "").trim();
      if (!name) return json_({ ok: false, error: "event_name is required" });

      const row = {
        event_id: Utilities.getUuid(),
        event_name: name.slice(0, 160),
        event_date: String(input.event_date || "").slice(0, 40),
        location: String(input.location || "").slice(0, 200),
        status: String(input.status || "planning").slice(0, 40),
        created_at: new Date().toISOString(),
      };
      appendObject_("Events", row);
      return json_({ ok: true, data: row });
    }

    return json_({ ok: false, error: "Unknown action" });
  } catch (error) {
    console.error("FLYApp POST action failed", error);
    return json_({ ok: false, error: "Backend request failed" });
  }
}

function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("FLYAPP_SPREADSHEET_ID");
  if (!id) throw new Error("Missing FLYAPP_SPREADSHEET_ID script property.");
  return SpreadsheetApp.openById(id);
}

function authorized_(providedKey) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty("FLYAPP_API_KEY");
  if (!expectedKey || !providedKey) return false;
  const a = String(providedKey);
  const b = String(expectedKey);
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function readRows_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1)
    .filter((row) => row.some((cell) => cell !== "" && cell !== null))
    .map((row) => headers.reduce((record, header, index) => {
      const value = row[index];
      record[header] = value instanceof Date ? value.toISOString() : value;
      return record;
    }, {}));
}

function appendObject_(sheetName, record) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) throw new Error("Missing sheet: " + sheetName);
  const headers = SHEET_HEADERS[sheetName];
  sheet.appendRow(headers.map((header) => record[header] === undefined ? "" : record[header]));
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
