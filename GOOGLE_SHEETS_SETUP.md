# Google Sheets test backend

This branch adds a server-only Google Sheets client and a protected event API at `/api/sheets/events`. It is a first integration slice; the rest of the app's reads/writes and authentication still need to be migrated before Base44 can be removed.

## Required server-side values

Configure these as **server-side** values; never use `VITE_*` names for secrets:

- `FLYAPP_SHEETS_WEB_APP_URL`: the deployed Apps Script URL ending in `/exec`
- `FLYAPP_API_KEY`: the same secret as the Apps Script `FLYAPP_API_KEY` Script Property
- `FLYAPP_TEST_ACCESS_TOKEN`: a separate long random token protecting the FLYApp test endpoint

For local Cloudflare/Vite development, create a private `.dev.vars` file at the repository root with those three assignments. Do not commit that file. For a deployed Worker, configure them as Worker secrets instead.

## Test endpoint

The endpoint requires the header `x-flyapp-test-token: <FLYAPP_TEST_ACCESS_TOKEN>`.

- `GET /api/sheets/events` lists events from the Google Sheets `Events` tab.
- `POST /api/sheets/events` creates an event. JSON body shape:

```json
{
  "event": {
    "event_name": "FLYApp connection test",
    "event_date": "2026-10-29",
    "location": "Test only",
    "status": "planning"
  }
}
```

The test token is separate from the Sheets API key so the Sheets credential is never exposed to the browser. Do not deploy the test endpoint publicly for general use; replace the temporary test-token gate with the app's real authentication/authorization before production.

## Apps Script

The source is in `google-apps-script/Code.gs`. It supports health checks, listing events and schedules, and creating test events. In Apps Script, keep `FLYAPP_SPREADSHEET_ID` and `FLYAPP_API_KEY` in Project Settings > Script properties.
