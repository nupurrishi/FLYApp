# FLYApp Google Sheets migration

## Current status

The app has a small client helper at `src/api/googleSheetsClient.js` that checks
whether the Google Apps Script deployment returns the expected FLYApp status
payload.

**This is not a complete data backend yet.** The current Apps Script deployment
only returns a health/status response. It does not support authentication,
reading rows, or writing rows.

## Configure the local test URL

1. Copy `.env.example` to `.env` in your local Codespaces workspace.
2. Set `VITE_GOOGLE_SHEETS_WEB_APP_URL` to the deployed Apps Script Web App URL.
3. Restart the Vite development server after changing environment variables.

Do not commit your personal `.env` file.

## Important migration guardrails

- Keep the existing Base44 client and auth flows unchanged until the replacement
  authentication and data API have been designed and tested.
- Do not put passwords, private keys, or service-account credentials in frontend
  environment variables. Variables prefixed with `VITE_` are exposed to the browser.
- Do not expose spreadsheet reads or writes through an unauthenticated Apps Script
  endpoint. Before connecting real user data, implement and test authentication,
  authorization, input validation, and role-based access in the backend.
- Keep production WordPress and the existing Supabase project untouched during this
  prototype migration.
