import React from 'react';
import { Link } from 'react-router-dom';
import { useDarkModeClasses } from './DarkModeWrapper';
import { useTheme } from '../contexts/ThemeContext';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';

function SubscriptionPrompt() {
  const darkMode = useDarkModeClasses();
  const { isDarkMode } = useTheme();

  const plans = [
    {
      name: 'Monthly',
      price: '$9.99',
      period: '/month',
      features: ['50 AI worksheet generations', 'Advanced analytics', 'All subjects supported'],
      popular: false
    },
    {
      name: 'Annual',
      price: '$99.99',
      period: '/year',
      features: ['600 AI worksheet generations', 'Priority support', 'Save 17%'],
      popular: true
    },
    {
      name: 'Lifetime',
      price: '$299.99',
      period: 'one-time',
      features: ['Unlimited AI generations', 'VIP support', 'Best value!'],
      popular: false
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
          <Sparkles className="w-10 h-10 text-purple-500" />
        </div>
        
        <h1 className={`text-4xl font-bold ${darkMode.text} mb-4`}>
          Unlock Premium Features
        </h1>
        <p className={`text-xl ${darkMode.textSecondary} max-w-2xl mx-auto`}>
          Choose a plan to start generating AI-powered worksheets for your kids
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`relative ${darkMode.card} p-8 rounded-2xl shadow-lg ${
              plan.popular ? 'ring-2 ring-purple-500 transform scale-105' : ''
            } hover:shadow-xl transition-all`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className={`text-2xl font-bold ${darkMode.text} mb-2`}>{plan.name}</h3>
              <div className="flex items-baseline justify-center">
                <span className={`text-4xl font-bold ${darkMode.text}`}>{plan.price}</span>
                <span className={`text-lg ${darkMode.textSecondary} ml-1`}>{plan.period}</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                  <span className={darkMode.text}>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to={`/#pricing`}
              className={`block w-full py-3 rounded-xl font-semibold text-center transition-all transform hover:scale-105 ${
                plan.popular
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  : `border ${darkMode.buttonSecondary}`
              }`}
            >
              Get Started
              <ArrowRight className="inline-block w-4 h-4 ml-2" />
            </Link>
          </div>
        ))}
      </div>

      <div className={`${darkMode.card} rounded-xl p-6 text-center`}>
        <p className={`${darkMode.textSecondary} mb-4`}>
          Already have an account? Your subscription will be activated immediately after payment.
        </p>
        <Link
          to="/"
          className={`inline-flex items-center text-purple-500 hover:text-purple-600 font-medium`}
        >
          View all features
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}

export default SubscriptionPrompt;