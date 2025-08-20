# AWS Deployment Guide for Math Worksheet Platform

This guide will help you deploy the Math Worksheet Platform to AWS with automatic HTTPS, DNS configuration, and production-ready setup.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Domain** hosted on Route53 (personalpod.net)
4. **API Keys**:
   - OpenAI API Key
   - Google OAuth Client ID & Secret

## Quick Deploy

1. **Make scripts executable**:
   ```bash
   chmod +x aws-deploy.sh create-deployment-package.sh
   ```

2. **Run the deployment**:
   ```bash
   ./aws-deploy.sh
   ```

This script will:
- Create an EC2 instance (t3.medium)
- Set up security groups
- Configure DNS (worksheets.personalpod.net)
- Install Docker and dependencies
- Deploy the application with HTTPS

## What Gets Deployed

### Infrastructure
- **EC2 Instance**: Ubuntu 22.04 LTS, t3.medium
- **Storage**: 30GB GP3 SSD
- **Elastic IP**: Static IP address
- **Security Group**: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- **DNS**: A record for worksheets.personalpod.net

### Application Stack
- **Caddy**: Reverse proxy with automatic HTTPS
- **Frontend**: React app served by Nginx
- **Backend**: Node.js Express API
- **Database**: MongoDB with authentication
- **SSL**: Automatic Let's Encrypt certificates

## Post-Deployment Configuration

1. **SSH into the server**:
   ```bash
   ssh -i math-worksheet-key.pem ubuntu@<ELASTIC_IP>
   ```

2. **Navigate to the app directory**:
   ```bash
   cd ~/math-worksheet-platform
   ```

3. **Edit the environment file**:
   ```bash
   nano .env
   ```

4. **Add your API keys**:
   ```env
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. **Restart the services**:
   ```bash
   docker-compose restart
   ```

## Update Google OAuth

Update your Google Cloud Console with the new redirect URI:
- `https://worksheets.personalpod.net/api/auth/google/callback`

## Monitoring & Maintenance

### View Logs
```bash
ssh -i math-worksheet-key.pem ubuntu@<ELASTIC_IP>
cd ~/math-worksheet-platform
docker-compose logs -f
```

### Check Status
```bash
./monitor.sh
```

### Backup MongoDB
```bash
./backup.sh
```

### Update Application
```bash
git pull
docker-compose build
docker-compose up -d
```

## Security Considerations

1. **Firewall**: UFW is configured with minimal ports open
2. **HTTPS**: Caddy automatically provisions SSL certificates
3. **MongoDB**: Secured with authentication
4. **Secrets**: All sensitive data in environment variables
5. **Headers**: Security headers configured in Caddy

## Troubleshooting

### Check if services are running
```bash
docker-compose ps
```

### View specific service logs
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs caddy
```

### Restart a specific service
```bash
docker-compose restart backend
```

### Check SSL certificate status
```bash
docker exec math-platform-caddy caddy list-certificates
```

## Costs

Estimated monthly costs:
- EC2 t3.medium: ~$30/month
- EBS Storage (30GB): ~$3/month
- Elastic IP: Free while attached
- Data Transfer: Varies by usage
- **Total**: ~$35-50/month

## Backup Strategy

Automated backups run daily and keep the last 7 days. To restore:

```bash
# List backups
ls ~/backups/

# Restore a backup
docker exec -i math-platform-mongodb mongorestore \
  --authenticationDatabase admin \
  --username ${MONGO_ROOT_USERNAME} \
  --password ${MONGO_ROOT_PASSWORD} \
  --archive < ~/backups/mongodb_backup_TIMESTAMP.tar.gz
```

## Scaling

To handle more traffic:
1. Upgrade instance type (t3.large, t3.xlarge)
2. Add CloudFront CDN for static assets
3. Use RDS for MongoDB (managed service)
4. Add Application Load Balancer for multiple instances

## Support

- Application logs: `docker-compose logs -f`
- System logs: `sudo journalctl -u docker`
- Caddy logs: `/var/log/caddy/access.log`

Remember to regularly update your packages and Docker images for security!