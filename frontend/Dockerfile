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
FROM nginx:1.25.3-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set up necessary directories and permissions for non-root usage
RUN mkdir -p /tmp/nginx/client-body /tmp/nginx/proxy /tmp/nginx/fastcgi /tmp/nginx/uwsgi /tmp/nginx/scgi && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /tmp/nginx && \
    # Create a directory that nginx can write to
    mkdir -p /var/cache/nginx/client_temp && \
    mkdir -p /var/cache/nginx/proxy_temp && \
    mkdir -p /var/cache/nginx/fastcgi_temp && \
    mkdir -p /var/cache/nginx/uwsgi_temp && \
    mkdir -p /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx

# Install curl for healthchecks
RUN apk --no-cache add curl

# Check if Nginx config is valid before proceeding
RUN nginx -t

# Switch to non-root user
USER nginx

# Health check with more lenient settings
HEALTHCHECK --interval=5s --timeout=10s --start-period=15s --retries=6 \
    CMD curl -f http://localhost:8080/health || wget -q --spider http://localhost:8080/health || exit 1

# Expose port 8080
EXPOSE 8080

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off; error_log /dev/stderr info;"]
