# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci --no-audit --prefer-offline && \
    npm cache clean --force

# Copy the rest of the application
COPY . .

# Set environment variable for production build
ENV NODE_ENV=production

# Install build dependencies and build the application
RUN apk add --no-cache \
    python3 \
    make \
    g++ && \
    npm run build

# Production stage
FROM node:18-alpine as production

# Install nginx and other dependencies
RUN apk add --no-cache nginx && \
    mkdir -p /run/nginx && \
    mkdir -p /usr/share/nginx/html && \
    chown -R nginx:nginx /var/lib/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    rm -f /etc/nginx/conf.d/*.default

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set working directory
WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit --prefer-offline

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start Nginx and keep it running in the foreground
CMD ["sh", "-c", "nginx -g 'daemon off; error_log /dev/stderr info;'"]
