# FLYApp

Mobile-first fashion-show production workspace built with React 19, TanStack Start, Cloudflare Workers, Supabase Auth and Google Sheets.

## Roles

- **Model:** personal call times, assigned looks, fittings, hair and makeup, show updates and notifications.
- **Designer:** collections, looks, model assignments and event information.
- **Admin:** event setup, team assignments, schedules, lookbooks, hair and makeup, running order, announcements and applications.

Public registration offers Model and Designer only. Admin access must be provisioned privately in Supabase.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Create `.dev.vars` with the server-only values below. Never commit this file.
4. Run `npm run dev`.

Required local `.dev.vars` values:

```dotenv
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
FLYAPP_SHEETS_WEB_APP_URL=https://script.google.com/macros/s/your-deployment-id/exec
FLYAPP_API_KEY=the-same-secret-configured-in-Apps-Script
```

The Supabase publishable key is safe for client use; the Google Sheets API key must remain server-side.

## Build

```bash
npm run build
``

The build outputs a Cloudflare Worker in `dist/server` and browser assets in `dist/client`. Configure the same server variables as Cloudflare Worker variables/secrets before deployment. Set the Supabase Auth Site URL and allowed redirect URLs to the deployed app origin.

## Data and access model

Supabase Auth authenticates accounts. The `public.profiles` row supplies each user's role and profile. The server verifies the Supabase access token and then uses the private Apps Script API to read and write the event data in Google Sheets. Server functions in `src/lib/server-fns.js` and `src/lib/manage-fns.js` apply role and event-membership checks through `src/lib/guard.server.js`.

The Sheets adapter intentionally preserves the existing server-function interface while replacing the Base44 persistence layer. Do not expose the Apps Script API key in a `VITE_*` variable or browser code.

## Google Sheets

The Apps Script source is in `google-apps-script/Code.gs`. Configure `FLYAPP_SPREADSHEET_ID` and `FLYAPP_API_KEY` in Apps Script Project Settings > Script Properties. Run `setupFlyAppSheets` and deploy the script as a Web App. The spreadsheet needs the entity tabs created by the setup function.

## Important release checks

Before inviting public users, verify registration, email confirmation/redirects, sign-in, role provisioning, event membership, model and designer data isolation, admin writes, schedule updates, notifications and mobile layouts against the deployed Worker. A successful local build alone is not a production-readiness test.
