# apps/web/Dockerfile — PostSpritz Next.js Web Frontend
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Install root & workspace dependencies
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/web/package*.json ./apps/web/
RUN npm install

# Copy source files
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/web ./apps/web

# Build shared types
RUN npm run build:types

FROM base AS dev
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM base AS build
WORKDIR /app
RUN npm run --workspace=apps/web build

FROM node:20-alpine AS prod
RUN apk add --no-cache curl && \
    addgroup -S app && adduser -S app -G app
WORKDIR /app/apps/web
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/shared-types /app/packages/shared-types
COPY --from=build /app/apps/web /app/apps/web
COPY package*.json /app/
USER app
EXPOSE 3000
CMD ["npm", "run", "start"]
