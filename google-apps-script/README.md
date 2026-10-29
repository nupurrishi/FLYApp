# Google Sheets test backend: install and test

This repository contains the Apps Script source at `google-apps-script/Code.gs`.
The existing Apps Script deployment is still the original public health-check endpoint
until a human installs this source and redeploys it. **No production app data is connected.**

## Before installing

- Use only the private `FLYApp Test Database` spreadsheet.
- Do not use this prototype for real model/designer personal information.
- The shared API key is a prototype gate, not a full identity system. The eventual app
  must call the API from a trusted server-side function; never place the key in a
  `VITE_*` variable or browser bundle.
- Keep the current Base44 login/authentication and data backend unchanged during testing.

## Install the script

1. Open the Apps Script project attached to the private test spreadsheet.
2. Replace the contents of `Code.gs` with the full source in this repository's
   `google-apps-script/Code.gs`.
3. In Apps Script, open **Project Settings → Script properties** and add:
   - `FLYAPP_SPREADSHEET_ID`: the ID between `/d/` and `/edit` in the spreadsheet URL.
   - `FLYAPP_API_KEY`: a newly generated long random secret. Keep it private.
4. Save the project.
5. Run `setupFlyAppSheets` from the Apps Script editor once and approve the Google
   permissions prompt. It creates any missing tabs and adds headers only to empty tabs.
6. Run `testFlyAppBackend` from the editor. Confirm it reports the spreadsheet name and
   the four expected tabs.
7. Open **Deploy → Manage deployments**, edit the existing Web App deployment, choose
   a new version, and deploy. Keep access settings restricted as much as possible for the
   prototype. Apps Script deployments that must be called by an external server may require
   public web-app access; if so, the API key is only an additional gate, not a replacement
   for real user authorization.
8. Open the deployed URL without parameters. It should still return the FLYApp health JSON.

## API actions currently implemented in this script

- `GET ?action=health`: public health check; no sheet rows are returned.
- `GET ?action=listEvents&key=...`: reads Events rows.
- `GET ?action=listSchedules&event_id=...&key=...`: reads Schedules rows, optionally filtered by event.
- `POST` JSON body `{"action":"createEvent","key":"...","event":{"event_name":"Test event","event_date":"2026-11-11","location":"Test location","status":"draft"}}`: appends one event row and returns its generated ID.

The GET actions currently accept the key in the query string because Apps Script's web-app
GET interface is simple; query strings can be recorded in logs/history, so do not use these
actions with a real secret or real data in a public environment. Before app integration,
move authorization to a server-to-server design that does not expose secrets in URLs, add
proper identity/role checks, and test all allowed and denied operations.

## Smoke test checklist

- [ ] Existing health URL still returns `status: connected`.
- [ ] `testFlyAppBackend` reports all four tabs.
- [ ] A request without a key cannot read Events or Schedules.
- [ ] A test createEvent request with a key appends exactly one row to the test sheet.
- [ ] A createEvent request without a key is rejected.
- [ ] No secret or private spreadsheet ID is committed to GitHub.

## Current limitation

This script is a backend prototype only. The React app is **not yet using it** for login,
event lists, schedules, or any other live app screen. Do not merge the migration PR or
switch off Base44 until the server-side bridge, authentication, authorization, and
regression tests are complete.
