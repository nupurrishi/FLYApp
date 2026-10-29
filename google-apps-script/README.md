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
7. To verify that writing works before connecting the app, run `createSmokeTestEvent` once.
   Confirm a row named `FLYApp Smoke Test ...` appears in the `Events` tab. This deliberately
   creates a test row; delete it afterward if you want a clean sheet.
8. Open **Deploy → Manage deployments**, edit the existing Web App deployment, choose
   a new version, and deploy. Keep access settings restricted as much as possible for the
   prototype. Apps Script deployments that must be called by an external server may require
   public web-app access; if so, the API key is only an additional gate, not a replacement
   for real user authorization.
8. Open the deployed URL without parameters. It should still return the FLYApp health JSON.

## Connect new-event creation in the Codespaces preview

The app now has a **server-only, best-effort mirror** for newly created events. Base44 remains
the primary database and login provider; event creation still goes through the existing
admin authorization check. The mirror sends only event name, start date, venue/city, and
status to the test spreadsheet. It does not migrate existing events or update/delete rows.

Set these environment variables in the same terminal session used to start the Codespaces
preview. Do not add real values to .env, commit them, or use VITE_ prefixes:

- FLYAPP_SHEETS_WEB_APP_URL: deployed Apps Script Web App URL ending in /exec.
- FLYAPP_API_KEY: the secret already set in Apps Script Script Properties.

For a temporary local test, stop the dev server with Ctrl+C, then run the following commands
in the Codespaces terminal. The secret is entered silently and is not part of the command
history:

```bash
read -r -p "Apps Script /exec URL: " FLYAPP_SHEETS_WEB_APP_URL
read -r -s -p "Apps Script API key: " FLYAPP_API_KEY
printf '\n'
export FLYAPP_SHEETS_WEB_APP_URL FLYAPP_API_KEY
npm run dev
```

Create a new test event while signed in as an app admin, then check the private test
spreadsheet's Events tab. If the app reports event creation succeeded but no row appears,
check the Codespaces server terminal for a [FLYApp] Google Sheets event mirror failed
message. If either environment variable is missing, the mirror is intentionally skipped.

This is a development prototype, not a production migration. Keep Base44 login and data
available. Do not merge this branch or rely on Sheets as the source of truth until the
end-to-end test and deployment configuration have been reviewed.
## API actions currently implemented in this script

- Apps Script editor function `createSmokeTestEvent`: adds one clearly labelled test row to `Events`.
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
