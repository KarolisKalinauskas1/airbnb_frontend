# Build stage
FROM node:18.18.2-alpine3.18 as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:1.25.3-alpine3.18-slim

# Install security updates
RUN apk --no-cache upgrade

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chmod 644 /etc/nginx/conf.d/default.conf

# Remove default nginx files
RUN rm -f /etc/nginx/conf.d/*.default

# Expose port 8080 for Railway
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
