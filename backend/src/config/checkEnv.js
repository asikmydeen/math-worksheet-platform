// Check required environment variables
function checkRequiredEnvVars() {
  const required = {
    // Core
    'JWT_SECRET': 'JWT secret for authentication',
    'MONGODB_URI': 'MongoDB connection string',
    
    // OAuth
    'GOOGLE_CLIENT_ID': 'Google OAuth client ID',
    'GOOGLE_CLIENT_SECRET': 'Google OAuth client secret',
    
    // OpenAI
    'OPENAI_API_KEY': 'OpenAI API key for worksheet generation',
    
    // Stripe (optional but needed for payments)
    'STRIPE_SECRET_KEY': 'Stripe secret key (optional)',
    'STRIPE_MONTHLY_PRICE_ID': 'Stripe monthly plan price ID (optional)',
    'STRIPE_ANNUAL_PRICE_ID': 'Stripe annual plan price ID (optional)',
    'STRIPE_LIFETIME_PRICE_ID': 'Stripe lifetime plan price ID (optional)',
  };

  const missing = [];
  const warnings = [];

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      if (key.startsWith('STRIPE_')) {
        warnings.push(`⚠️  ${key} is not set - ${description}`);
      } else {
        missing.push(`❌ ${key} is required - ${description}`);
      }
    }
  }

  if (missing.length > 0) {
    console.error('\n🚨 Missing required environment variables:\n');
    missing.forEach(msg => console.error(msg));
    console.error('\nPlease check your .env file and ensure all required variables are set.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  Optional environment variables not set:\n');
    warnings.forEach(msg => console.warn(msg));
    console.warn('\nPayment features will be disabled without Stripe configuration.\n');
  }

  // Additional validation
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('❌ STRIPE_SECRET_KEY should start with "sk_test_" or "sk_live_"');
    process.exit(1);
  }

  console.log('✅ All required environment variables are configured\n');
}

module.exports = checkRequiredEnvVars;