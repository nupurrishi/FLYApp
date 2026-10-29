# FLYApp development notes

- This is a self-hosted TanStack Start app using React, Better Auth, PostgreSQL, Node.js, and Docker Compose. See `README.md` for setup and release instructions.
- Keep JavaScript/JSX conventions; `src/routeTree.gen.ts` is generated and should not be edited by hand.
- Every server function and server route is an HTTP entry point. Validate inputs and enforce session, event membership, ownership, and role permissions in the server handler. Frontend route gates and hidden buttons are not authorization.
- Keep authentication secrets, database credentials, SMTP credentials, and production exports out of source and browser builds.
- Store event records using the existing entity service until a reviewed schema migration replaces it. Additive migrations only; never clear production records during setup.
- Run `pnpm lint`, `pnpm test`, and `pnpm build` after changes when dependencies are available.
