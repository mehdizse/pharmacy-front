# Stage 1: Build Angular application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps to resolve conflicts
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build: application
RUN npm run build

# Debug: Check what was built
RUN echo "=== BUILD OUTPUT ==="
RUN ls -la /app/
RUN echo "=== DIST CONTENT ==="
RUN ls -la /app/dist/ || echo "No dist folder"
RUN find /app -name "index.html" -type f

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Debug: Check what was copied
RUN echo "=== NGINX HTML ROOT ==="
RUN ls -la /usr/share/nginx/html/
RUN find /usr/share/nginx/html -name "index.html" -type f || echo "No index.html found"

# Copy our nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
