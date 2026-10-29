FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 UPLOAD_DIR=/data/uploads
WORKDIR /app
RUN corepack enable && addgroup --system --gid 10001 flyapp && adduser --system --uid 10001 --ingroup flyapp flyapp
COPY --from=build --chown=flyapp:flyapp /app/node_modules ./node_modules
COPY --from=build --chown=flyapp:flyapp /app/.output ./.output
COPY --from=build --chown=flyapp:flyapp /app/scripts ./scripts
COPY --from=build --chown=flyapp:flyapp /app/src/lib/db.server.js ./src/lib/db.server.js
COPY --from=build --chown=flyapp:flyapp /app/src/lib/auth.server.js ./src/lib/auth.server.js
COPY --from=build --chown=flyapp:flyapp /app/src/lib/mail.server.js ./src/lib/mail.server.js
RUN mkdir -p /data/uploads && chown -R flyapp:flyapp /data
USER flyapp
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/time').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["sh", "-c", "node scripts/check-env.mjs && exec node .output/server/index.mjs"]
