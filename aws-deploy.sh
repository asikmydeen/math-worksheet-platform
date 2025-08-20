#!/bin/bash

# Math Worksheet Platform - AWS Deployment Script
# This script sets up the entire infrastructure on AWS

set -e  # Exit on error

# Configuration
DOMAIN="personalpod.net"
SUBDOMAIN="math"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"
INSTANCE_TYPE="t3.medium"
KEY_NAME="math-worksheet-key"
SECURITY_GROUP_NAME="math-worksheet-sg"
INSTANCE_NAME="Math-Worksheet-Platform"
REGION="us-east-1"  # Change if needed
HOSTED_ZONE_ID="Z09986491SPH6NV3XHWO9"

echo "🚀 Starting AWS deployment for ${FULL_DOMAIN}"

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if key pair exists, create if not
echo "🔑 Checking SSH key pair..."
if ! aws ec2 describe-key-pairs --key-names ${KEY_NAME} --region ${REGION} &> /dev/null; then
    echo "Creating new key pair..."
    aws ec2 create-key-pair --key-name ${KEY_NAME} --query 'KeyMaterial' --output text --region ${REGION} > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo "✅ Key pair created: ${KEY_NAME}.pem"
else
    echo "✅ Key pair already exists"
fi

# Create security group
echo "🔒 Setting up security group..."
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${SECURITY_GROUP_NAME}" --query 'SecurityGroups[0].GroupId' --output text --region ${REGION} 2>/dev/null || echo "None")

if [ "$SG_ID" == "None" ] || [ -z "$SG_ID" ]; then
    echo "Creating new security group..."
    SG_ID=$(aws ec2 create-security-group \
        --group-name ${SECURITY_GROUP_NAME} \
        --description "Security group for Math Worksheet Platform" \
        --region ${REGION} \
        --query 'GroupId' \
        --output text)
    
    echo "Adding security group rules..."
    # Add rules
    aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 22 --cidr 0.0.0.0/0 --region ${REGION}
    aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 80 --cidr 0.0.0.0/0 --region ${REGION}
    aws ec2 authorize-security-group-ingress --group-id ${SG_ID} --protocol tcp --port 443 --cidr 0.0.0.0/0 --region ${REGION}
    echo "✅ Security group created: ${SG_ID}"
else
    echo "✅ Security group already exists: ${SG_ID}"
fi

# Get latest Ubuntu AMI
echo "🖥️  Finding latest Ubuntu AMI..."
AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text \
    --region ${REGION})
echo "✅ Using AMI: ${AMI_ID}"

# Launch EC2 instance
echo "🚀 Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --image-id ${AMI_ID} \
    --instance-type ${INSTANCE_TYPE} \
    --key-name ${KEY_NAME} \
    --security-group-ids ${SG_ID} \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=${INSTANCE_NAME}}]" \
    --user-data file://user-data.sh \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
    --query 'Instances[0].InstanceId' \
    --output text \
    --region ${REGION})

echo "✅ Instance launched: ${INSTANCE_ID}"
echo "⏳ Waiting for instance to be running..."

aws ec2 wait instance-running --instance-ids ${INSTANCE_ID} --region ${REGION}

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids ${INSTANCE_ID} \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text \
    --region ${REGION})

echo "✅ Instance is running with IP: ${PUBLIC_IP}"

# Create Elastic IP and associate
echo "🔗 Allocating Elastic IP..."
ALLOCATION_ID=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text --region ${REGION})
aws ec2 associate-address --instance-id ${INSTANCE_ID} --allocation-id ${ALLOCATION_ID} --region ${REGION}

ELASTIC_IP=$(aws ec2 describe-addresses --allocation-ids ${ALLOCATION_ID} --query 'Addresses[0].PublicIp' --output text --region ${REGION})
echo "✅ Elastic IP allocated: ${ELASTIC_IP}"

# Update Route53
echo "🌐 Updating DNS records..."
cat > /tmp/route53-record.json << EOF
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "${FULL_DOMAIN}",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [
          {
            "Value": "${ELASTIC_IP}"
          }
        ]
      }
    }
  ]
}
EOF

CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id ${HOSTED_ZONE_ID} \
    --change-batch file:///tmp/route53-record.json \
    --query 'ChangeInfo.Id' \
    --output text)

echo "✅ DNS record created/updated"
echo "⏳ Waiting for DNS propagation..."

# Create deployment package
echo "📦 Creating deployment package..."
./create-deployment-package.sh ${ELASTIC_IP} ${FULL_DOMAIN}

echo "⏳ Waiting for instance to be ready (user-data to complete)..."
sleep 60  # Give instance time to run user-data script

# Copy files to instance
echo "📤 Copying files to instance..."
scp -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no deployment-package.tar.gz ubuntu@${ELASTIC_IP}:~/

# Deploy application
echo "🚀 Deploying application..."
ssh -i ${KEY_NAME}.pem -o StrictHostKeyChecking=no ubuntu@${ELASTIC_IP} << 'ENDSSH'
cd ~
tar -xzf deployment-package.tar.gz
cd math-worksheet-platform
./deploy.sh
ENDSSH

echo "✅ Deployment complete!"
echo ""
echo "========================================="
echo "🎉 Math Worksheet Platform deployed successfully!"
echo "========================================="
echo "🌐 URL: https://${FULL_DOMAIN}"
echo "📍 IP Address: ${ELASTIC_IP}"
echo "🔑 SSH: ssh -i ${KEY_NAME}.pem ubuntu@${ELASTIC_IP}"
echo "🆔 Instance ID: ${INSTANCE_ID}"
echo ""
echo "⚠️  Important: Update your Google OAuth redirect URIs to:"
echo "   - https://${FULL_DOMAIN}/api/auth/google/callback"
echo ""
echo "📝 Next steps:"
echo "1. Access your site at https://${FULL_DOMAIN}"
echo "2. Update Google OAuth redirect URIs"
echo "3. Monitor logs: ssh into instance and run 'docker-compose logs -f'"
echo "========================================="

# Cleanup
rm -f /tmp/route53-record.json