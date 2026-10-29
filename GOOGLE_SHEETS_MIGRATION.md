# FLYApp Google Sheets migration

## Current status

- `src/api/googleSheetsClient.js` contains a small browser-side health-check helper.
  It is not used by the login flow or production data screens.
- `google-apps-script/Code.gs` is the source for a prototype Apps Script API.
- `google-apps-script/README.md` has the installation and smoke-test instructions.

**The app is not yet using Google Sheets for real app data.** The deployed Apps Script
URL remains the original health-check endpoint until the script is installed and redeployed.
Even after deployment, the API must be called through a trusted server-side bridge before
it can safely serve app users.

## Current API prototype

The script supports a health check, reading test Events/Schedules rows, and creating a test
event. It uses a script property for the API key, but the current GET endpoints accept that
key in the URL. That is not suitable for a real secret or real user data in a public
environment. Do not connect the app to these endpoints yet.

## Configuration

The `.env.example` file documents the public health-check URL variable. Variables prefixed
with `VITE_` are exposed to the browser. **Never place API keys, passwords, or private
credentials in a `VITE_*` variable.** The eventual app bridge should read private credentials
only on the server.

## Migration guardrails

- Keep the existing Base44 client and login/auth flows unchanged until replacement
  authentication and data access are designed, tested, and reviewed.
- Do not expose spreadsheet reads/writes through an unauthenticated endpoint.
- Implement identity verification, role/event membership authorization, validation, and
  denied-access tests before connecting any user-facing screen.
- Use only the private test spreadsheet during prototyping.
- Keep production WordPress and the existing Supabase project untouched during this
  prototype migration.
- Do not merge the migration PR or switch off Base44 until regression tests pass.
