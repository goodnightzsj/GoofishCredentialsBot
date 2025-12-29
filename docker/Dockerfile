# syntax=docker/dockerfile:1.7

FROM node:20-bookworm AS builder

WORKDIR /app

# better-sqlite3 may require native build tools (node-gyp)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm ci
RUN npm ci --prefix frontend

COPY . .

RUN npm run build --prefix frontend \
    && npm run copy:frontend \
    && npm run build

# Include runtime assets expected under dist/
RUN mkdir -p dist/assets \
    && cp -r src/assets/* dist/assets/ || true

# Remove devDependencies for runtime image
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir -p data logs \
    && chown -R node:node /app

USER node
EXPOSE 3000

CMD ["node", "dist/index.js"]
