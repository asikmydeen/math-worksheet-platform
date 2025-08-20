#\!/bin/bash
# Run the admin email initialization script using Docker

echo "🚀 Initializing admin emails using Docker..."

# Run the script inside the backend Docker container
docker run --rm \
  --network math-worksheet-platform_default \
  -v $(pwd)/scripts:/app/scripts \
  -v $(pwd)/.env:/app/.env \
  --workdir /app \
  math-worksheet-platform-backend:latest \
  node /app/scripts/init-admin-emails.js

echo "✅ Admin email initialization complete\!"
