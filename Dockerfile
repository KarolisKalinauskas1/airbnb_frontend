# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Copy package files first for better layer caching
COPY frontend/package*.json ./

# Install dependencies with clean cache
RUN npm ci --no-audit --prefer-offline && \
    npm cache clean --force

# Copy the rest of the application
COPY frontend/ .

# Set environment variable for production build
ENV NODE_ENV=production
# Build the application with production settings
RUN npm run build

# Production stage
FROM nginx:1.25.3-alpine3.18-slim

# Install security updates and tools
RUN apk --no-cache upgrade && \
    apk add --no-cache curl

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create necessary directories and set permissions
RUN mkdir -p /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx files and clean up
RUN rm -f /etc/nginx/conf.d/*.default && \
    rm -rf /usr/share/nginx/html/50x.html && \
    rm -rf /var/cache/apk/*

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose port 8080 for Railway
EXPOSE 8080

# Start Nginx with debug logging
CMD ["nginx", "-g", "daemon off; error_log /dev/stderr info;"]
