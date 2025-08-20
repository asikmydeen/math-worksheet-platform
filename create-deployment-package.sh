#!/bin/bash

# Create deployment package for AWS
# Usage: ./create-deployment-package.sh <ELASTIC_IP> <DOMAIN>

ELASTIC_IP=$1
DOMAIN=$2

echo "📦 Creating deployment package..."

# Save original directory
ORIGINAL_DIR=$(pwd)

# Create temporary directory
TEMP_DIR=$(mktemp -d)
PACKAGE_DIR="${TEMP_DIR}/math-worksheet-platform"

# Copy necessary files
mkdir -p ${PACKAGE_DIR}
cp -r backend ${PACKAGE_DIR}/
cp -r frontend ${PACKAGE_DIR}/
cp docker-compose.prod.yml ${PACKAGE_DIR}/docker-compose.yml
cp Caddyfile ${PACKAGE_DIR}/
cp .env.production ${PACKAGE_DIR}/.env.example

# Create setup script
cat > ${PACKAGE_DIR}/setup-env.sh << 'EOF'
#!/bin/bash

# Setup environment variables
echo "🔧 Setting up environment variables..."

# Generate secure passwords
MONGO_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Copy from your current .env
cp /home/ubuntu/current.env .env 2>/dev/null || cp .env.example .env

# Update production-specific variables
sed -i "s|MONGO_ROOT_PASSWORD=.*|MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|g" .env
sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://worksheets.personalpod.net|g" .env
sed -i "s|CLIENT_URL=.*|CLIENT_URL=https://worksheets.personalpod.net|g" .env

echo "✅ Environment variables configured"
echo ""
echo "⚠️  IMPORTANT: Edit .env to add:"
echo "   - OPENAI_API_KEY"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
EOF

# Create deployment script
cat > ${PACKAGE_DIR}/deploy.sh << EOF
#!/bin/bash

set -e

echo "🚀 Deploying Math Worksheet Platform..."

# Make scripts executable
chmod +x setup-env.sh

# Setup environment if not exists
if [ ! -f .env ]; then
    ./setup-env.sh
fi

# Update Caddyfile with correct domain
sed -i "s|worksheets.personalpod.net|${DOMAIN}|g" Caddyfile

# Build Docker images
echo "🏗️  Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose down 2>/dev/null || true
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check if services are running
docker-compose ps

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application is available at: https://${DOMAIN}"
echo ""
echo "📝 Next steps:"
echo "1. SSH into the server: ssh -i math-worksheet-key.pem ubuntu@${ELASTIC_IP}"
echo "2. Edit /home/ubuntu/math-worksheet-platform/.env to add API keys"
echo "3. Restart services: cd math-worksheet-platform && docker-compose restart"
echo "4. View logs: docker-compose logs -f"
EOF

# Create monitoring script
cat > ${PACKAGE_DIR}/monitor.sh << 'EOF'
#!/bin/bash

# Simple monitoring script

echo "📊 Math Worksheet Platform Status"
echo "================================"
echo ""

# Check Docker containers
echo "🐳 Docker Containers:"
docker-compose ps
echo ""

# Check disk usage
echo "💾 Disk Usage:"
df -h | grep -E "^/dev/"
echo ""

# Check memory usage
echo "🧠 Memory Usage:"
free -h
echo ""

# Check recent logs
echo "📋 Recent Logs (last 20 lines):"
docker-compose logs --tail=20
echo ""

# Check Caddy certificate status
echo "🔒 SSL Certificate Status:"
docker exec math-platform-caddy caddy list-certificates
EOF

# Create backup script
cat > ${PACKAGE_DIR}/backup.sh << 'EOF'
#!/bin/bash

# Backup MongoDB data

BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mongodb_backup_${TIMESTAMP}"

echo "🔄 Starting MongoDB backup..."

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Perform backup
docker exec math-platform-mongodb mongodump \
    --authenticationDatabase admin \
    --username ${MONGO_ROOT_USERNAME} \
    --password ${MONGO_ROOT_PASSWORD} \
    --out /backup/${BACKUP_NAME}

# Compress backup
docker exec math-platform-mongodb tar -czf /backup/${BACKUP_NAME}.tar.gz -C /backup ${BACKUP_NAME}

# Copy to host
docker cp math-platform-mongodb:/backup/${BACKUP_NAME}.tar.gz ${BACKUP_DIR}/

# Cleanup container backup
docker exec math-platform-mongodb rm -rf /backup/${BACKUP_NAME} /backup/${BACKUP_NAME}.tar.gz

echo "✅ Backup completed: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Keep only last 7 backups
cd ${BACKUP_DIR}
ls -t mongodb_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "🧹 Old backups cleaned up"
EOF

# Make all scripts executable
chmod +x ${PACKAGE_DIR}/*.sh

# Create tarball
cd ${TEMP_DIR}
tar -czf deployment-package.tar.gz math-worksheet-platform

# Move to original directory
mv deployment-package.tar.gz ${ORIGINAL_DIR}/

# Cleanup
rm -rf ${TEMP_DIR}

echo "✅ Deployment package created: deployment-package.tar.gz"