# Fly Showcase — fashion show production platform

A full-stack Base44 app: [TanStack Start](https://tanstack.com/start) (React 19, plain JavaScript) with file-based routes, server functions, and the Base44 backend (auth, database, file storage) — hosted by Base44.

## What this app does

Production tooling for fashion shows: events, teams, schedules, lookbooks, hair & makeup, live show control, notifications, opportunities and applications.

**Three roles** (nothing else):

| Role | How it is granted | What they get |
| --- | --- | --- |
| Admin / Manager | the Base44 `User.role = "admin"` (set by workspace admins / invites) | the whole production: events, team, schedule, looks, hair & makeup, running order, announcements, applications, audit log |
| Designer | an `EventMember` row with `role: "designer"` | their own collections, looks, lookbook uploads and assignments (plus read-only schedule / show info) |
| Model | an `EventMember` row with `role: "model"` | their own call times, fittings, looks, hair & makeup, readiness tasks and notifications |

There is no separate Stage Manager or Backstage Manager role — those tools live in the single Admin / Manager surface.

## Routes

| Route | Page |
| --- | --- |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | auth (public) |
| `/` | role dashboard (Model / Designer / Admin) |
| `/events`, `/events/$eventId` | event selection and event workspace |
| `/schedule` | agenda, timeline and calendar of schedule items |
| `/lookbook` | collections, looks, reference images, model assignments |
| `/hair-makeup` | appointments, stations, artists, status |
| `/live` | running order, show control (admins), live status for everyone |
| `/notifications` | notification centre |
| `/profile` | own profile, measurements, brand details, memberships |
| `/opportunities` | casting calls and applications |
| `/admin`, `/admin/announcements`, `/admin/applications`, `/admin/activity` | team, readiness tasks, communications, applications, audit log |

## Security model

Entity access rules in `base44/entities/*.jsonc` are **admin-only** for every protected record. Models and designers never read the database directly: every page goes through server functions in `src/lib/server-fns.js` (reads) and `src/lib/manage-fns.js` (writes). Each of those re-checks the caller's identity, role and event membership with the helpers in `src/lib/guard.server.js` before touching data with the service-role client — so hiding a link is never what protects a record. A model cannot open another model's look, appointment or measurement record by changing an id, and a designer can only write their own collections and looks.

## Sample data

One sample event ("Artmosphere — Season 7") is seeded with placeholder designers, models, looks, schedule items, hair & makeup appointments and a running order so the screens can be explored. Delete it from the event page (or edit it) once your own production exists — its members are placeholders and cannot sign in.

## Run locally

## Run locally

```bash
npm ci
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + app together
```

## Build and publish

```bash
npm run build         # -> dist/client (assets) + dist/server (the Worker)
base44 deploy         # or publish from the Base44 builder
```

There is no `index.html`: the HTML document is rendered on the server from `src/routes/__root.jsx`. The build runs through the [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/), so dev and build both execute server code in `workerd`.

## How the pieces fit

- **Pages** are files in `src/routes/`. A route's `loader` runs on the server for a document request and in the browser for a client navigation; `Route.useLoaderData()` gives the component the resolved data.
- **Server functions** (`src/lib/server-fns.js`) are RPCs created with `createServerFn`. `src/start.js` runs every one of them through `authMiddleware`, which sends the visitor's token along, so `context.getBase44()` returns a client acting as that visitor and entity access rules apply. `context.getBase44().asServiceRole` bypasses them, so use it only after authenticating the caller (`.middleware([requireUser])`) and checking they may access the records involved: server functions and server routes are public endpoints anyone can call with any input. See **Server Security** in `AGENTS.md`. Call it only in handlers that need Base44: it reads the platform headers, and a handler that never calls it works without them.
- **Secrets** are read in server code with `import { secrets } from "base44:runtime"` → `secrets.get("NAME")`, inside a handler. Never `process.env`.
- **Server routes** (`src/routes/api/*.js`) are raw HTTP endpoints for URLs something other than the app's own code requests (webhooks, downloads, feeds); the app's pages call server functions. `src/start.js` runs every request through `base44RequestMiddleware`, so their `server.handlers` receive the same `context.getBase44()` (`({ request, params, context }) => …`).
- **Server-only code** lives in `*.server.js` files (TanStack refuses to bundle them for the browser).
- **Auth** is resolved client-side after hydration (`useAuth()`); the server is anonymous on a document request, so give per-user pages `ssr: false`.
- **Sign-in and gated pages** are not wired in the starter: `src/components/auth/` holds the pages (login, register, password reset, MCP consent) and a login gate for `src/routes/_authed/`, to add when the app needs them. See **Adding Authentication** in `AGENTS.md`.
- **AI**: TanStack AI is installed and runs on the Base44 AI gateway, with no API key and usage billed to the app's AI credits. `gatewayModel(context.getBase44())` in `src/lib/ai.server.js` builds the adapter; `AGENTS.md` has a streaming chat example (a server route plus `useChat`).
- **Caching**: the platform caches only what a route opts into via `headers()` (`Cache-Control: public, s-maxage=…`). Everything else is served fresh.