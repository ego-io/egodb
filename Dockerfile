# builder
FROM node:18-bullseye-slim as builder

WORKDIR /undb

RUN npm install -g turbo
COPY . .
RUN turbo prune --scope=@undb/backend --scope=@undb/frontend

ADD https://github.com/benbjohnson/litestream/releases/download/v0.3.9/litestream-v0.3.9-linux-amd64-static.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz

# installer
FROM node:18-bullseye-slim AS installer

RUN npm install -g pnpm

WORKDIR /undb

COPY --from=builder /undb/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm fetch

COPY --from=builder /undb/out/ .

RUN pnpm install -r --offline

ARG PUBLIC_UNDB_ANALYTICS_DOMAIN
ARG PUBLIC_UNDB_ADMIN_EMAIL
ARG PUBLIC_UNDB_ADMIN_PASSWORD

ENV NODE_ENV production
RUN pnpm run build --filter=backend --filter=frontend

RUN rm -rf ./node_modules
RUN HUSKY=0 pnpm install -r --prod

# runner
FROM node:18-bullseye-slim as runner

WORKDIR /undb

EXPOSE 4000

ENV NODE_ENV production
ENV UNDB_DATABASE_SQLITE_DATA /var/opt/.undb

RUN npm install -g zx

COPY --from=installer /undb/node_modules ./node_modules
COPY --from=installer /undb/packages ./packages
COPY --from=installer /undb/apps/backend ./apps/backend
COPY --from=installer /undb/apps/frontend/build ./out
COPY --from=builder /usr/local/bin/litestream /usr/local/bin/litestream
COPY scripts/start.mjs ./scripts/start.mjs

COPY litestream/etc/litestream.yml /etc/litestream.yml

CMD ["scripts/start.mjs"]
