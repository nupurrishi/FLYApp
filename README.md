# FLYApp

FLYApp is an event operations application for fashion shows and similar productions. The current web application uses TanStack Start, React 19, Base44 authentication/data/storage, and the Cloudflare Vite runtime used by Base44 publishing. The production backend remains Base44; this branch does not migrate or mirror client data to another service.

## Current implementation

The web app has authenticated routes for dashboards, events, schedule, lookbook, hair and makeup, live running order, notifications, profiles, opportunities/applications, admin, audit activity, and readiness tasks. Server functions read and write Base44 entities. They use server-side role and event membership checks; entity access rules remain admin-only so browser code cannot bypass those checks by calling an entity directly.

| Event role | Access |
| --- | --- |
| Admin | Global event and account administration; all event operations, team membership, announcements, opportunities, applications, audit records, and data management. The role comes from the Base44 account and is not self-assignable in FLYApp. |
| Model | Event information and schedule items allowed by audience/assignment; own look assignments, hair/makeup appointments, readiness tasks, notifications, and profile. Can update their own assignment status and readiness tasks. |
| Designer | Event schedule and announcements; own collections and looks; assignment status for their looks. May assign looks only to models who belong to the same event. |
| Stage Manager | Event schedule and assignments, show segments, running order, live status, and event announcements. Cannot administer accounts, team membership, event lifecycle, applications, or backstage readiness. |
| Backstage Manager | Event look assignments, hair/makeup appointments, model readiness tasks, and event announcements. Cannot administer accounts, team membership, event lifecycle, or applications. |

Roles other than Admin are assigned by an Admin on each event. Removed memberships do not grant event access. Server functions validate input and confirm that edited records belong to the requested event. Model assignment emails and schedule assignments must refer to event members.

## Architecture and migration status

The GitHub default branch is the Base44 application described above. The repository also contains exploratory Google Sheets and native mobile branches, and an open draft PR for a token-protected Sheets test endpoint. Those do not replace the current data store or provide production authentication. A separate Sheets migration branch substantially rewrites the write layer. WordPress/MySQL has also been explored, but there is no active WordPress backend in this release branch. No migration is applied and no production records are copied, reset, or overwritten here.

The Base44 web app is the only configured production target in this repository. `wrangler.jsonc` configures the Worker entry used by the Base44/Cloudflare build; it is not evidence that a standalone Cloudflare deployment or custom domain has been configured. The repository does not contain a production domain, account credentials, or a database export. Confirm the client-owned Base44 workspace, plan, domain, and backup policy before production handoff.

## Requirements and local setup

Use a Node.js version supported by the installed Vite and Base44 CLI releases, and npm. Copy `.env.example` to `.env` and replace the public app configuration values with the values from the client-owned Base44 app. These `VITE_` values are included in the browser build and must never contain API keys or passwords.

```sh
npm install
npx base44 login
npx base44 link
npm run dev
```

Base44 access is required for local server functions and authentication. Do not use a production workspace for destructive testing. The source repository does not include production data or a development seed dataset.

## Checks

```sh
npm run lint
npm test
npm run build
```

The unit tests exercise the pure server authorization helpers with mocked data. They do not replace an authenticated integration test against a configured Base44 workspace. Also verify sign-in, password reset, invitations, event membership, each role's access, CRUD persistence, and mobile layouts in a non-production Base44 environment before release.

## Deploying

The configured workflow is to publish through the client-owned Base44 workspace, not to run `wrangler deploy` directly:

```sh
npm run build
npx base44 deploy
```

The Base44 owner must complete CLI/browser authorization, link this repository to the intended app, configure the app ID and function version, set the client domain in Base44, and review billing. Do not put backend secrets in `.env`, source code, or `VITE_` variables. The current application uses Base44-managed authentication, records, file storage, and invitations. There are no Google Sheets, MySQL, or Firebase credentials required by the current web branch.

### First administrator

Do not create an unrestricted administrator through a public registration flow or add a hardcoded admin account. The owner must create/verify the designated account in the client’s Base44 workspace and grant the Base44 `admin` role from the workspace’s trusted user administration controls. Then sign in and add event-specific staff through **Admin Management**. FLYApp does not contain an automatic bootstrap-admin command.

### Data protection and backups

The current Base44 integration is the source of truth. Before client rollout, identify the workspace owner, retention policy, export format, and backup/restore process with Base44. Test restoration using a non-production copy. Event deletion in the app removes event-linked records and must be treated as destructive; take an export first. Never use setup or migration steps to clear production records.

## Client handoff checklist

- Confirm the client owns the Base44 workspace, app, and domain, and can authorize the Base44 CLI.
- Configure `.env` values locally and verify the same app ID and function version in the hosted workspace.
- Verify the Base44 admin account and invite the initial event team with event-specific roles.
- Run the checks above and exercise each workflow with separate test accounts in a non-production event.
- Confirm the workspace billing tier, data export/backup policy, and domain renewal ownership.
- Deploy from the reviewed release branch through Base44; verify direct navigation, refresh, auth expiry, and phone layouts on the deployed URL.
- Do not connect the Sheets test endpoint or mobile/Firebase branch to production until its authentication, data ownership, migration and recovery plans are separately reviewed.

## Known limitations and unverified work

- No Base44 account credentials or linked client workspace are available in this checkout. Hosted authentication, data persistence, invitations, deployment, domain setup, and billing have not been verified here.
- No production domain, client data export, backup configuration, or established migration plan is present in the repository.
- The repository’s prior Sheets, WordPress/MySQL, and Expo/Firebase work remains exploratory and has not been adopted by this web release branch.
- The draft Sheets PR describes itself as a test integration and explicitly says it does not replace Base44 auth or the remaining entity operations.
- No real sample event is seeded in the current branch; create test records only in a non-production workspace.
