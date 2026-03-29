# Build Stage
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production Stage
FROM node:22-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/firebase-applet-config.json ./

# Expose port 3000 (AI Studio requirement)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.ts"]
