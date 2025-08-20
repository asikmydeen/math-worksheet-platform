const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Protect all routes except webhook
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-checkout-session', paymentController.createCheckoutSession);
router.post('/payment-success', paymentController.handlePaymentSuccess);
router.get('/subscription-status', paymentController.getSubscriptionStatus);
router.post('/cancel-subscription', paymentController.cancelSubscription);

module.exports = router;