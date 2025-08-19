# Frontend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Accept build arguments
ARG REACT_APP_API_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application files
COPY . .

# Set environment variable for build
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy custom entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

# Start nginx with custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]