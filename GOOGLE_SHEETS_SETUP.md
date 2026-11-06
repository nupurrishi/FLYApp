# Google Sheets backend

FLYApp uses Supabase Auth for identity and the Apps Script Web App as its private event-data API. The server-side adapter in `src/lib/sheets-entity-adapter.server.js` supplies the data interface used by the existing schedule, lookbook, hair/makeup, announcement and admin server functions.

## Configure Apps Script

1. Open the Google Sheet that will hold FLYApp data.
2. Open Extensions > Apps Script and replace the script with `google-apps-script/Code.gs`.
3. In Project Settings > Script Properties, set:
   - `FLYAPP_SPREADSHEET_ID`: the spreadsheet ID.
   - `FLYAPP_API_KEY`: a long random secret.
4. Run `setupFlyAppSheets` once and approve the requested permissions.
5. Deploy as a Web App. Set execution to your account and access to anyone. The API key is the application-level gate; keep it private.
6. Copy the deployed `/exec` URL.

## Configure FLYApp

Local development uses a private `.dev.vars` file at the repository root:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
FLYAPP_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/your-deployment-id/exec
FLYAPP_API_KEY=the-same-secret-configured-in-Apps-Script
```

For Cloudflare, configure the same values as Worker variables/secrets. The Apps Script API key must never be placed in a `VITE_*` variable or sent to the browser.

## Supported data entities

The Apps Script schema initializes Users, Events, EventMembers, ScheduleItems, Collections, Looks, LookAssignments, HairMakeup, ShowSegments, Announcements, Notifications, ReadinessTasks, AuditLog, DesignerProfiles, Opportunities and Applications. Existing spreadsheet data and headers are preserved; missing headers are appended by `setupFlyAppSheets`.

## Smoke test endpoint

The temporary `/api/sheets/events` endpoint remains protected by a separate `FLYAPP_TEST_ACCESS_TOKEN` and is intended only for backend diagnostics. It is not the authentication mechanism used by the app's normal server functions. Do not treat a successful smoke test as proof that all role-based workflows are ready for public use.
