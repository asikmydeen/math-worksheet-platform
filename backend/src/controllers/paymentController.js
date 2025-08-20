const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Price IDs for different plans (you'll need to create these in Stripe Dashboard)
const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
  annual: process.env.STRIPE_ANNUAL_PRICE_ID,
  lifetime: process.env.STRIPE_LIFETIME_PRICE_ID
};

// Create checkout session
exports.createCheckoutSession = catchAsync(async (req, res, next) => {
  const { plan } = req.body;
  const user = req.user;

  if (!['monthly', 'annual', 'lifetime'].includes(plan)) {
    return next(new AppError('Invalid plan selected', 400));
  }

  // Create or retrieve Stripe customer
  let customerId = user.subscription.stripeCustomerId;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString()
      }
    });
    
    customerId = customer.id;
    user.subscription.stripeCustomerId = customerId;
    await user.save();
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICE_IDS[plan],
        quantity: 1
      }
    ],
    mode: plan === 'lifetime' ? 'payment' : 'subscription',
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/pricing`,
    metadata: {
      userId: user._id.toString(),
      plan: plan
    }
  });

  res.status(200).json({
    status: 'success',
    sessionId: session.id,
    url: session.url
  });
});

// Handle successful payment (called from frontend after redirect)
exports.handlePaymentSuccess = catchAsync(async (req, res, next) => {
  const { session_id } = req.body;
  
  if (!session_id) {
    return next(new AppError('Session ID is required', 400));
  }

  // Retrieve the session from Stripe
  const session = await stripe.checkout.sessions.retrieve(session_id);
  
  if (!session || session.payment_status !== 'paid') {
    return next(new AppError('Payment not completed', 400));
  }

  const userId = session.metadata.userId;
  const plan = session.metadata.plan;
  
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update user subscription
  user.subscription.plan = plan;
  user.subscription.subscriptionStatus = 'active';
  user.accessLevel = 'premium';
  
  if (plan !== 'lifetime') {
    user.subscription.stripeSubscriptionId = session.subscription;
  }

  // Set AI requests limit based on plan
  switch(plan) {
    case 'monthly':
      user.subscription.aiRequestsLimit = 50;
      break;
    case 'annual':
      user.subscription.aiRequestsLimit = 600;
      break;
    case 'lifetime':
      user.subscription.aiRequestsLimit = -1; // Unlimited
      break;
  }

  user.subscription.aiRequestsUsed = 0;
  user.subscription.resetDate = new Date();
  
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Payment processed successfully',
    user: {
      email: user.email,
      subscription: user.subscription,
      accessLevel: user.accessLevel
    }
  });
});

// Handle Stripe webhooks
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  const user = await User.findOne({ 
    'subscription.stripeSubscriptionId': subscription.id 
  });
  
  if (!user) return;

  user.subscription.subscriptionStatus = subscription.status;
  
  if (subscription.status === 'active') {
    user.accessLevel = 'premium';
  } else if (['canceled', 'past_due'].includes(subscription.status)) {
    user.accessLevel = 'basic';
  }
  
  await user.save();
}

// Handle subscription cancellation
async function handleSubscriptionCancellation(subscription) {
  const user = await User.findOne({ 
    'subscription.stripeSubscriptionId': subscription.id 
  });
  
  if (!user) return;

  user.subscription.plan = 'free';
  user.subscription.subscriptionStatus = 'canceled';
  user.subscription.aiRequestsLimit = 10;
  user.accessLevel = 'basic';
  
  await user.save();

  // Update allowed email status
  const allowedEmail = await AllowedEmail.findOne({ email: user.email });
  if (allowedEmail) {
    allowedEmail.accessLevel = 'basic';
    await allowedEmail.save();
  }
}

// Handle failed payments
async function handleFailedPayment(invoice) {
  const user = await User.findOne({ 
    'subscription.stripeCustomerId': invoice.customer 
  });
  
  if (!user) return;

  user.subscription.subscriptionStatus = 'past_due';
  user.accessLevel = 'basic';
  
  await user.save();
}

// Get subscription status
exports.getSubscriptionStatus = catchAsync(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    status: 'success',
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.subscriptionStatus,
      aiRequestsUsed: user.subscription.aiRequestsUsed,
      aiRequestsLimit: user.subscription.aiRequestsLimit,
      resetDate: user.subscription.resetDate
    }
  });
});

// Cancel subscription
exports.cancelSubscription = catchAsync(async (req, res, next) => {
  const user = req.user;

  if (!user.subscription.stripeSubscriptionId) {
    return next(new AppError('No active subscription found', 400));
  }

  // Cancel the subscription in Stripe
  await stripe.subscriptions.update(
    user.subscription.stripeSubscriptionId,
    { cancel_at_period_end: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Subscription will be canceled at the end of the billing period'
  });
});