import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from '../hooks/useKeyboardShortcuts';
import PWAInstallPrompt from './PWAInstallPrompt';

function AppWithShortcuts({ children }) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onShowHelp: () => setShowShortcutsHelp(true),
    onToggleTheme: toggleDarkMode,
    onClose: () => {
      // Close shortcuts help if open
      if (showShortcutsHelp) {
        setShowShortcutsHelp(false);
      }
    }
  });

  return (
    <>
      {children}
      <PWAInstallPrompt />
      <KeyboardShortcutsHelp 
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

export default AppWithShortcuts;