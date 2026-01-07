# Use the official Bun image
FROM oven/bun:1-slim AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the application
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS release
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

# Expose the port SvelteKit runs on
EXPOSE 3000

# Start the app
ENV NODE_ENV=production
CMD ["bun", "./build/index.js"]
