# apps/api/Dockerfile — PostSpritz Express API
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Install root & workspace dependencies
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/api/package*.json ./apps/api/
RUN npm install

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

# Build shared-types first
RUN npm run build:types

FROM base AS dev
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM base AS build
WORKDIR /app
RUN npm run --workspace=apps/api build

FROM node:20-alpine AS prod
RUN apk add --no-cache curl && \
    addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared-types ./packages/shared-types
COPY --from=build /app/apps/api ./apps/api
COPY package*.json ./
USER app
WORKDIR /app/apps/api
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD curl -f http://localhost:4000/health || exit 1
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/server.js"]
