import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import { useLocation } from 'react-router-dom';
import paymentService from '../services/payment';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calculator, 
  Shield, 
  CheckCircle, 
  Sparkles, 
  Users,
  Moon,
  Sun
} from 'lucide-react';

function Login() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const location = useLocation();
  const { user } = useAuth();

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Worksheets",
      description: "Generate custom worksheets with advanced AI technology"
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: Users,
      title: "Educator Focused",
      description: "Built by educators for educators and learners"
    }
  ];

  useEffect(() => {
    // Handle redirect after login
    if (user && location.state?.selectedPlan) {
      paymentService.createCheckoutSession(location.state.selectedPlan)
        .catch(err => console.error('Payment redirect error:', err));
    }
  }, [user, location.state]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500'} flex items-center justify-center p-4`}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white/20 text-white hover:bg-white/30'}`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className={`${darkMode.card} rounded-3xl shadow-2xl p-8 w-full max-w-md relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-full transform translate-x-16 -translate-y-16"></div>
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h2 className={`text-3xl font-bold ${darkMode.text} mb-2`}>
              Welcome to PersonalPod
            </h2>
            <p className={`${darkMode.textSecondary} text-lg`}>
              Sign in to create amazing worksheets with AI
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-purple-500 mt-0.5" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${darkMode.text} text-sm`}>{feature.title}</h3>
                    <p className={`${darkMode.textMuted} text-xs`}>{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Google Sign In Button */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center px-6 py-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-[1.02] group"
          >
            <svg className="w-6 h-6 mr-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className={`${darkMode.text} font-semibold text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors`}>
              Continue with Google
            </span>
          </a>

          {/* Security Notice */}
          <div className={`mt-8 p-4 rounded-xl ${isDarkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'} border`}>
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className={`font-semibold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'} text-sm mb-1`}>
                  Secure & Private
                </h4>
                <p className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Access is restricted to authorized educators. Your account is protected by Google's security.
                </p>
              </div>
            </div>
          </div>

          {/* Access Note */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className={`text-sm font-medium ${darkMode.text}`}>Authorized Access Only</span>
            </div>
            <p className={`text-xs ${darkMode.textMuted}`}>
              If you don't have access, please contact your administrator to add your email to the allowed list.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className={`text-xs ${darkMode.textMuted}`}>
              By signing in, you agree to our terms of service and privacy policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;