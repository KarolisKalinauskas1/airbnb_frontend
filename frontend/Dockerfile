# Build stage
FROM node:18.18.2-alpine3.18 AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25.3-alpine3.18-slim

# Install security updates and tools for debugging
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

# Remove default nginx files
RUN rm -f /etc/nginx/conf.d/*.default && \
    rm -rf /usr/share/nginx/html/50x.html

# Create a simple health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Expose port 8080 for Railway
EXPOSE 8080

# Start Nginx with debug logging
CMD ["nginx", "-g", "daemon off; error_log /dev/stderr debug;"]
