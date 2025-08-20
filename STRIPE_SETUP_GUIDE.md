# Stripe Setup Guide for Math Worksheet Platform

## Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up for an account
2. Verify your email address
3. Complete your account setup (you can skip business details for testing)

## Step 2: Get Your API Keys

1. Log into your Stripe Dashboard: https://dashboard.stripe.com
2. Make sure you're in **TEST MODE** (toggle in the top right)
3. Go to **Developers → API keys**
4. Copy your keys:
   - **Publishable key**: `pk_test_...` (for frontend - not needed yet)
   - **Secret key**: `sk_test_...` (for backend - KEEP THIS SECURE)

## Step 3: Create Your Subscription Products

1. In Stripe Dashboard, go to **Products → Create product**
2. Create three products:

### Monthly Subscription
- **Name**: Math Worksheet Platform - Monthly
- **Description**: Monthly access to AI-powered math worksheets
- **Pricing**: 
  - Model: Recurring
  - Amount: $9.99 (or your price)
  - Billing period: Monthly
- **Copy the Price ID**: `price_...` (you'll need this)

### Annual Subscription
- **Name**: Math Worksheet Platform - Annual
- **Description**: Annual access with 2 months free
- **Pricing**: 
  - Model: Recurring
  - Amount: $99.99 (or your price)
  - Billing period: Yearly
- **Copy the Price ID**: `price_...`

### Lifetime Access
- **Name**: Math Worksheet Platform - Lifetime
- **Description**: One-time payment for lifetime access
- **Pricing**: 
  - Model: One-time
  - Amount: $299.99 (or your price)
- **Copy the Price ID**: `price_...`

## Step 4: Set Up Webhooks

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: `https://worksheets.brainybees.org/api/webhooks/stripe`
4. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret**: `whsec_...` (you'll need this)

## Step 5: Configure Environment Variables

SSH into your server and update the `.env` file:

```bash
ssh -i math-worksheet-key.pem ubuntu@54.227.108.229
cd /home/ubuntu/math-worksheet-platform
nano .env
```

Add/update these lines:

```env
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_MONTHLY_PRICE_ID=price_YOUR_MONTHLY_PRICE_ID
STRIPE_ANNUAL_PRICE_ID=price_YOUR_ANNUAL_PRICE_ID
STRIPE_LIFETIME_PRICE_ID=price_YOUR_LIFETIME_PRICE_ID
```

## Step 6: Update Docker Compose Configuration

Edit the production docker-compose file to include Stripe variables:

```bash
nano docker-compose.prod.yml
```

Add these environment variables to the backend service:

```yaml
    environment:
      # ... existing variables ...
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      STRIPE_MONTHLY_PRICE_ID: ${STRIPE_MONTHLY_PRICE_ID}
      STRIPE_ANNUAL_PRICE_ID: ${STRIPE_ANNUAL_PRICE_ID}
      STRIPE_LIFETIME_PRICE_ID: ${STRIPE_LIFETIME_PRICE_ID}
```

## Step 7: Restart Services

```bash
docker-compose down
docker-compose -f docker-compose.prod.yml up -d
```

## Step 8: Test Your Integration

1. Create a test account on your website
2. Go to the pricing page
3. Click on a plan to upgrade
4. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Requires authentication**: `4000 0025 0000 3155`
   - **Declined**: `4000 0000 0000 9995`
   - Use any future expiry date and any 3-digit CVC

## Step 9: Monitor in Stripe Dashboard

1. Check **Payments** to see test transactions
2. Check **Customers** to see created customers
3. Check **Events** to see webhook deliveries
4. Check **Logs** for API requests

## Troubleshooting

### Common Issues:

1. **"No such price" error**: Make sure you're using test keys with test prices
2. **Webhook failures**: Check the webhook endpoint URL is correct
3. **Payment not updating user**: Check webhook logs in Stripe dashboard
4. **CORS errors**: Make sure CLIENT_URL is set correctly

### Verify Configuration:

```bash
# Check if environment variables are loaded
docker exec math-platform-backend printenv | grep STRIPE

# Check backend logs
docker logs math-platform-backend --tail 50

# Test webhook manually (from Stripe dashboard)
# Go to Webhooks → Your endpoint → Send test webhook
```

## Moving to Production

When ready for real payments:

1. Switch to **LIVE MODE** in Stripe Dashboard
2. Create products/prices in live mode
3. Get live API keys (`sk_live_...`)
4. Update webhook with live endpoint
5. Update `.env` with live keys and price IDs
6. Test with a real card (small amount)

## Security Notes

- NEVER commit API keys to Git
- Use environment variables only
- Keep webhook secrets secure
- Enable Stripe's security features (Radar, 3D Secure)
- Monitor for suspicious activity

## Additional Features to Consider

1. **Customer Portal**: Let users manage subscriptions
2. **Invoices**: Send automated receipts
3. **Tax Collection**: Use Stripe Tax if needed
4. **Discounts**: Create coupon codes
5. **Trial Periods**: Offer free trials