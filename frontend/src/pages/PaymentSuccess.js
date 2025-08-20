import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import paymentService from '../services/payment';
import { CheckCircle, Sparkles, ArrowRight, Loader2, XCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const darkMode = useDarkModeClasses();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError('Invalid payment session');
        setLoading(false);
        return;
      }

      try {
        const response = await paymentService.handlePaymentSuccess(sessionId);
        setSubscription(response.user.subscription);
        setLoading(false);
      } catch (err) {
        console.error('Payment verification error:', err);
        setError('Failed to verify payment. Please contact support.');
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <p className={`text-lg ${darkMode.text}`}>Verifying your payment...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className={`${darkMode.card} rounded-2xl shadow-lg p-8 text-center`}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className={`text-2xl font-bold ${darkMode.text} mb-4`}>Payment Error</h1>
            <p className={`${darkMode.textSecondary} mb-6`}>{error}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const getPlanDetails = (plan) => {
    switch (plan) {
      case 'monthly':
        return {
          name: 'Monthly Plan',
          features: '50 AI generations per month'
        };
      case 'annual':
        return {
          name: 'Annual Plan',
          features: '600 AI generations per year'
        };
      case 'lifetime':
        return {
          name: 'Lifetime Access',
          features: 'Unlimited AI generations forever'
        };
      default:
        return {
          name: 'Premium Plan',
          features: 'Enhanced features'
        };
    }
  };

  const planDetails = getPlanDetails(subscription?.plan);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className={`${darkMode.card} rounded-2xl shadow-lg p-8`}>
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            
            <h1 className={`text-3xl font-bold ${darkMode.text} mb-4`}>
              Payment Successful! 🎉
            </h1>
            <p className={`text-lg ${darkMode.textSecondary}`}>
              Welcome to {planDetails.name}
            </p>
          </div>

          {/* Plan Details */}
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-xl p-6 mb-8`}>
            <h2 className={`text-xl font-semibold ${darkMode.text} mb-3`}>Your Plan Benefits:</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className={darkMode.text}>{planDetails.features}</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className={darkMode.text}>Advanced analytics & insights</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className={darkMode.text}>Priority support</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className={darkMode.text}>Export to PDF/Word formats</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>What's Next?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/worksheets')}
                className="group px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center"
              >
                Create Your First Worksheet
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-6 py-3 rounded-lg font-medium transition-all border ${darkMode.buttonSecondary}`}
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* Support Info */}
          <div className={`mt-8 pt-8 border-t ${darkMode.border} text-center`}>
            <p className={`text-sm ${darkMode.textSecondary}`}>
              Need help? Contact our support team at{' '}
              <a href="mailto:support@brainybees.org" className="text-purple-500 hover:underline">
                support@brainybees.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default PaymentSuccess;