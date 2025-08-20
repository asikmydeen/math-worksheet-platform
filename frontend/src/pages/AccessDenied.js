import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import { 
  Shield, 
  Mail, 
  ArrowLeft,
  AlertTriangle,
  Moon,
  Sun
} from 'lucide-react';

function AccessDenied() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500'} flex items-center justify-center p-4`}>
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-lg transition-colors ${isDarkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white/20 text-white hover:bg-white/30'}`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className={`${darkMode.card} rounded-3xl shadow-2xl p-8 w-full max-w-lg text-center`}>
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
          <Shield className="w-10 h-10 text-red-500" />
        </div>

        {/* Header */}
        <h1 className={`text-3xl font-bold ${darkMode.text} mb-4`}>
          Access Denied
        </h1>
        
        <p className={`text-lg ${darkMode.textSecondary} mb-8`}>
          Your email address is not authorized to use this platform.
        </p>

        {/* Info Box */}
        <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border mb-8`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'} mb-2`}>
                Ready to Get Started?
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} mb-4`}>
                PersonalPod Worksheets helps parents and teachers create personalized learning experiences for kids.
              </p>
              <div className="space-y-2">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  Choose your plan:
                </p>
                <ul className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'} space-y-1`}>
                  <li>• <strong>Free Trial:</strong> 10 AI-generated worksheets</li>
                  <li>• <strong>Monthly:</strong> 50 worksheets per month - $9.99</li>
                  <li>• <strong>Lifetime:</strong> Unlimited access - $299.99 (Best Value!)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} mb-8`}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Mail className="w-4 h-4 text-purple-500" />
            <span className={`text-sm font-medium ${darkMode.text}`}>
              Need help?
            </span>
          </div>
          <p className={`text-xs ${darkMode.textMuted}`}>
            Contact support at{' '}
            <a 
              href="mailto:support@personalpod.net" 
              className="text-purple-500 hover:text-purple-600 font-medium"
            >
              support@personalpod.net
            </a>
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all"
          >
            🚀 Get Started - Choose Your Plan
          </Link>
          
          <button
            onClick={() => window.location.href = '/api/auth/google'}
            className={`px-6 py-3 rounded-xl font-semibold transition-all border ${darkMode.buttonSecondary}`}
          >
            Try Different Account
          </button>
          
          <Link
            to="/"
            className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all ${darkMode.textSecondary} hover:${darkMode.text}`}
          >
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back to Homepage
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-xs ${darkMode.textMuted}`}>
            PersonalPod Worksheets © 2024
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;