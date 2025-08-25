import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { showInstallPrompt } from '../serviceWorkerRegistration';

function PWAInstallPrompt() {
  const { isDarkMode } = useTheme();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if install prompt was previously dismissed
    const promptDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = promptDismissed ? new Date(promptDismissed) : null;
    const daysSinceDismissed = dismissedTime ? (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24) : Infinity;

    // Show prompt if not installed and not recently dismissed
    if (!isInstalled && daysSinceDismissed > 7) {
      // Listen for install prompt event
      const handleInstallable = () => {
        setShowPrompt(true);
      };

      window.addEventListener('pwainstallable', handleInstallable);

      // For iOS, show prompt after delay
      if (isIOSDevice) {
        setTimeout(() => setShowPrompt(true), 10000);
      }

      return () => {
        window.removeEventListener('pwainstallable', handleInstallable);
      };
    }
  }, []);

  const handleInstall = () => {
    if (isIOS) {
      // Show iOS instructions
      alert('To install BrainyBees:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"');
    } else {
      // Trigger install prompt
      showInstallPrompt();
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-lg shadow-lg z-50 ${
      isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
    }`}>
      <button
        onClick={handleDismiss}
        className={`absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700`}
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900' : 'bg-purple-100'}`}>
          <Smartphone className={`w-6 h-6 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Install BrainyBees
          </h3>
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Install our app for a better experience with offline access and faster loading!
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;