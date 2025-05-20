# syntax=docker/dockerfile:1.7
# Build stage
FROM --platform=linux/amd64 node:20.15.1-alpine3.20@sha256:8a7c6d8d1b3c8e2f9c1e4d5f6a7b8c9d0e1f2a3b4c5d6e7f809a1b2c3d4e5f6 AS builder

# Install build dependencies with version pinning and cleanup in one layer
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache \
    git~=2.45 \
    python3~=3.11 \
    make~=4.4 \
    g++~=12.2 \
    && rm -rf /var/cache/apk/*

# Set working directory and non-root user
WORKDIR /app

# Copy package files first for better layer caching
COPY --chown=node:node package*.json ./


# Install all dependencies with security audit and cleanup npm cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --prefer-offline --omit=dev \
    && npm cache clean --force

# Copy the rest of the application
COPY --chown=node:node . .

# Build the application with production settings
RUN npm run build

# Production stage
FROM --platform=linux/amd64 nginxinc/nginx-unprivileged:1.27.4-alpine3.21-slim@sha256:8f33576888f08d7d7a3d6f6f8e6d1c3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d

# Install security updates and clean up in one layer
USER root
RUN --mount=type=cache,target=/var/cache/apk \
    apk --no-cache upgrade \
    && rm -rf /var/cache/apk/*

# Copy nginx config with security headers
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Set secure permissions
RUN chmod -R 750 /usr/share/nginx/html \
    && chmod -R 750 /var/log/nginx \
    && chmod -R 750 /var/cache/nginx \
    && chmod 644 /etc/nginx/conf.d/default.conf \
    && find /usr/share/nginx/html -type f -exec chmod 640 {} \; \
    && find /usr/share/nginx/html -type d -exec chmod 750 {} \;

# Remove default nginx files and unnecessary packages
RUN rm -f /etc/nginx/conf.d/*.default \
    && rm -f /docker-entrypoint.d/* \
    && apk del --no-cache \
    && find /usr -type f -name "*.a" -delete \
    && find /usr -type f -name "*.la" -delete \
    && find /usr -type f -name "*.debug" -delete

# Run as non-root user
USER 101:101  # nginx user's UID in the nginxinc image

# Expose port for HTTP (NGINX default is 8080 in nginxinc/nginx-unprivileged)
EXPOSE 8080

# Health check with wget (lighter than curl)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start Nginx with security options
CMD ["nginx", "-g", "daemon off; error_log /dev/stderr info;"]
