# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY airbnb_frontend/frontend/package*.json ./

# Install dependencies with clean cache
RUN npm ci --no-audit --prefer-offline && \
    npm cache clean --force

# Copy the rest of the application
COPY airbnb_frontend/frontend/ .

# Set environment variable for production build
ENV NODE_ENV=production

# Install build dependencies and build the application
RUN apk add --no-cache \
    python3 \
    make \
    g++ && \
    npm run build

# Production stage
FROM nginx:1.25.3-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY airbnb_frontend/nginx.conf /etc/nginx/conf.d/

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx

# Switch to non-root user
USER nginx

# Health check with more lenient settings
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD wget --no-verbose --tries=3 --spider http://localhost/ || exit 1

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off; error_log /dev/stderr info;"]
