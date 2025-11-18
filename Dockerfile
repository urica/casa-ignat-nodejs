# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Build arguments for versioning
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# Metadata
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${VCS_REF}"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.title="Casa Ignat"
LABEL org.opencontainers.image.description="Casa Ignat - Pensiune și Restaurant Website"
LABEL org.opencontainers.image.vendor="Casa Ignat"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production only)
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

# Create app user with specific UID/GID for consistency
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Create necessary directories with proper permissions
RUN mkdir -p public/uploads/{rooms,gallery,menu,testimonials,blog,temp} && \
    mkdir -p logs && \
    chown -R nodejs:nodejs public/uploads logs

# Switch to non-root user for security
USER nodejs

# Expose port
EXPOSE 3000

# Health check using curl for better reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly (for graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/server.js"]
