const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Check if Stripe is configured
if (process.env.STRIPE_SECRET_KEY) {
  const paymentController = require('../controllers/paymentController');
  
  // Protect all routes except webhooks
  router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);
  router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), paymentController.handleWebhook);
  
  // Protected routes
  router.use(protect);
  
  router.post('/create-checkout-session', paymentController.createCheckoutSession);
  router.post('/payment-success', paymentController.handlePaymentSuccess);
  router.get('/subscription-status', paymentController.getSubscriptionStatus);
  router.post('/cancel-subscription', paymentController.cancelSubscription);
} else {
  // Return error for all payment routes if Stripe is not configured
  router.use((req, res) => {
    res.status(503).json({
      success: false,
      message: 'Payment processing is not configured. Please contact support.'
    });
  });
}

module.exports = router;