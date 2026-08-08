FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb* ./
# We don't use --frozen-lockfile in case there is no bun.lockb yet, or just regular install
RUN bun install

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built assets and dependencies from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set environment variables
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 5001

# Start the application
CMD ["bun", "run", "start"]
