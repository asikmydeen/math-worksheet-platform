import { loadStripe } from '@stripe/stripe-js';
import api from './api';

// Initialize Stripe (you'll need to add this to your .env file)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const paymentService = {
  // Create checkout session and redirect to Stripe
  async createCheckoutSession(plan) {
    try {
      const response = await api.post('/payments/create-checkout-session', { plan });
      const { sessionId, url } = response.data;
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        // Fallback to client-side redirect (older method)
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({ sessionId });
        
        if (error) {
          console.error('Stripe redirect error:', error);
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  },

  // Handle successful payment after redirect back
  async handlePaymentSuccess(sessionId) {
    try {
      const response = await api.post('/payments/payment-success', { 
        session_id: sessionId 
      });
      return response.data;
    } catch (error) {
      console.error('Payment success handling error:', error);
      throw error;
    }
  },

  // Get current subscription status
  async getSubscriptionStatus() {
    try {
      const response = await api.get('/payments/subscription-status');
      return response.data.subscription;
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw error;
    }
  },

  // Cancel subscription
  async cancelSubscription() {
    try {
      const response = await api.post('/payments/cancel-subscription');
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }
};

export default paymentService;