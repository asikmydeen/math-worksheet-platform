#!/bin/bash

# This script updates Stripe environment variables on the server

echo "Updating Stripe environment variables..."

# Replace these with your actual values from Stripe Dashboard
WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
MONTHLY_PRICE_ID="price_YOUR_MONTHLY_PRICE_ID"
ANNUAL_PRICE_ID="price_YOUR_ANNUAL_PRICE_ID"
LIFETIME_PRICE_ID="price_YOUR_LIFETIME_PRICE_ID"

# SSH into server and update the values
ssh -i math-worksheet-key.pem ubuntu@54.227.108.229 << EOF
cd /home/ubuntu/math-worksheet-platform/backend

# Update the Stripe configuration
sed -i "s/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET/" .env
sed -i "s/STRIPE_MONTHLY_PRICE_ID=.*/STRIPE_MONTHLY_PRICE_ID=$MONTHLY_PRICE_ID/" .env
sed -i "s/STRIPE_ANNUAL_PRICE_ID=.*/STRIPE_ANNUAL_PRICE_ID=$ANNUAL_PRICE_ID/" .env
sed -i "s/STRIPE_LIFETIME_PRICE_ID=.*/STRIPE_LIFETIME_PRICE_ID=$LIFETIME_PRICE_ID/" .env

echo "Environment variables updated. Restarting services..."

cd ..
docker-compose restart backend

echo "Done! Services restarted with new Stripe configuration."
EOF