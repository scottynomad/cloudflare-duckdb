# See https://hono.dev/docs/getting-started/nodejs#dockerfile
FROM node:20-bookworm-slim AS builder

ARG DUCKDB_VERSION=1.4.1

#USER node
WORKDIR /app

# Download DuckDB extensions early in the build for better caching
RUN apt-get update && apt-get install -y curl && \
    mkdir -p extensions && \
    for ext in httpfs motherduck iceberg avro; do \
    curl http://extensions.duckdb.org/v${DUCKDB_VERSION}/linux_amd64/${ext}.duckdb_extension.gz \
    --output extensions/${ext}.duckdb_extension.gz; \
    done && \
    gunzip extensions/*.duckdb_extension.gz && \
    apt-get remove -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY package*.json .
COPY container/tsconfig.json .
COPY container/ src/
RUN npm ci && \
    npm run build --omit=dev && \
    npm prune --production

FROM node:20-bookworm-slim
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono
RUN apt-get update && apt-get install -y ca-certificates

COPY --from=builder --chown=hono:nodejs /app/node_modules /app/node_modules
COPY --from=builder --chown=hono:nodejs /app/dist /app/dist
COPY --from=builder --chown=hono:nodejs /app/extensions /app/extensions
COPY --from=builder --chown=hono:nodejs /app/package.json /app/package.json

USER hono
ENV HOME=/tmp

EXPOSE 3000

CMD ["node", "/app/dist/src/index.js"]
