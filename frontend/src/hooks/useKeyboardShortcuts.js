import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SHORTCUTS = {
  // Navigation shortcuts
  'g h': { description: 'Go to Home', action: 'navigate', path: '/' },
  'g w': { description: 'Go to Worksheets', action: 'navigate', path: '/worksheets' },
  'g a': { description: 'Go to Analytics', action: 'navigate', path: '/analytics' },
  'g p': { description: 'Go to Profile', action: 'navigate', path: '/profile' },
  
  // Action shortcuts
  'n': { description: 'Create new worksheet', action: 'create-worksheet' },
  'c n': { description: 'Create new worksheet', action: 'create-worksheet' },
  '/': { description: 'Focus search', action: 'search' },
  '?': { description: 'Show keyboard shortcuts', action: 'help' },
  'esc': { description: 'Close modal/dialog', action: 'close' },
  
  // Worksheet solving shortcuts
  'j': { description: 'Next problem', action: 'next-problem' },
  'k': { description: 'Previous problem', action: 'prev-problem' },
  'enter': { description: 'Submit answer', action: 'submit-answer' },
  'h': { description: 'Show hint', action: 'show-hint' },
  's': { description: 'Save progress', action: 'save' },
  'cmd+enter': { description: 'Submit worksheet', action: 'submit-worksheet' },
  'ctrl+enter': { description: 'Submit worksheet', action: 'submit-worksheet' },
  
  // UI shortcuts
  't': { description: 'Toggle theme', action: 'toggle-theme' },
  'cmd+k': { description: 'Command palette', action: 'command-palette' },
  'ctrl+k': { description: 'Command palette', action: 'command-palette' },
};

export function useKeyboardShortcuts(handlers = {}) {
  const navigate = useNavigate();
  
  // Buffer for multi-key shortcuts
  const keyBuffer = [];
  let bufferTimeout;

  const clearBuffer = useCallback(() => {
    keyBuffer.length = 0;
  }, [keyBuffer]);

  const handleKeyPress = useCallback((event) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target.matches('input, textarea, select') && !event.metaKey && !event.ctrlKey) {
      return;
    }

    // Build key combination string
    const key = event.key.toLowerCase();
    const modifiers = [];
    if (event.metaKey || event.ctrlKey) modifiers.push(event.metaKey ? 'cmd' : 'ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey && key.length > 1) modifiers.push('shift');
    
    const keyCombo = [...modifiers, key].join('+');
    
    // Add to buffer for multi-key shortcuts
    keyBuffer.push(keyCombo);
    
    // Clear buffer after delay
    clearTimeout(bufferTimeout);
    bufferTimeout = setTimeout(clearBuffer, 1000);
    
    // Check shortcuts
    const bufferString = keyBuffer.join(' ');
    
    // Check exact match first
    let shortcut = SHORTCUTS[bufferString];
    
    // If no exact match, check if any shortcut starts with current buffer
    if (!shortcut) {
      const hasPartialMatch = Object.keys(SHORTCUTS).some(s => s.startsWith(bufferString));
      if (!hasPartialMatch) {
        clearBuffer();
        return;
      }
    }

    if (shortcut) {
      event.preventDefault();
      clearBuffer();

      // Handle different action types
      switch (shortcut.action) {
        case 'navigate':
          navigate(shortcut.path);
          break;
        
        case 'help':
          if (handlers.onShowHelp) {
            handlers.onShowHelp();
          }
          break;
        
        case 'create-worksheet':
          if (handlers.onCreateWorksheet) {
            handlers.onCreateWorksheet();
          } else {
            navigate('/worksheets?action=create');
          }
          break;
        
        case 'search':
          if (handlers.onSearch) {
            handlers.onSearch();
          } else {
            document.querySelector('[data-search-input]')?.focus();
          }
          break;
        
        case 'close':
          if (handlers.onClose) {
            handlers.onClose();
          } else {
            // Try to close any open modals
            document.querySelector('[data-modal-close]')?.click();
          }
          break;
        
        case 'toggle-theme':
          if (handlers.onToggleTheme) {
            handlers.onToggleTheme();
          }
          break;
        
        case 'next-problem':
          if (handlers.onNextProblem) {
            handlers.onNextProblem();
          }
          break;
        
        case 'prev-problem':
          if (handlers.onPrevProblem) {
            handlers.onPrevProblem();
          }
          break;
        
        case 'show-hint':
          if (handlers.onShowHint) {
            handlers.onShowHint();
          }
          break;
        
        case 'submit-answer':
          if (handlers.onSubmitAnswer) {
            handlers.onSubmitAnswer();
          }
          break;
        
        case 'submit-worksheet':
          if (handlers.onSubmitWorksheet) {
            handlers.onSubmitWorksheet();
          }
          break;
        
        case 'save':
          if (handlers.onSave) {
            handlers.onSave();
          }
          break;
        
        case 'command-palette':
          if (handlers.onCommandPalette) {
            handlers.onCommandPalette();
          }
          break;
      }
    }
  }, [navigate, handlers, keyBuffer, clearBuffer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      clearTimeout(bufferTimeout);
    };
  }, [handleKeyPress]);

  return { shortcuts: SHORTCUTS };
}

// Keyboard shortcuts help modal component
export function KeyboardShortcutsHelp({ isOpen, onClose, isDarkMode }) {
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = {
    Navigation: ['g h', 'g w', 'g a', 'g p'],
    Actions: ['n', '/', '?', 'esc'],
    'Worksheet Solving': ['j', 'k', 'enter', 'h', 's', 'cmd+enter'],
    UI: ['t', 'cmd+k']
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-2xl w-full rounded-lg shadow-xl max-h-[80vh] overflow-hidden ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Keyboard Shortcuts
          </h2>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(shortcutGroups).map(([group, shortcuts]) => (
            <div key={group} className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {group}
              </h3>
              <div className="space-y-2">
                {shortcuts.map(shortcut => {
                  const info = SHORTCUTS[shortcut];
                  const keys = shortcut.split(' ').map(k => 
                    k.split('+').map(part => 
                      part === 'cmd' ? '⌘' : part
                    ).join('+')
                  );
                  
                  return (
                    <div key={shortcut} className="flex justify-between items-center">
                      <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {info.description}
                      </span>
                      <div className="flex gap-1">
                        {keys.map((key, i) => (
                          <kbd
                            key={i}
                            className={`px-2 py-1 text-sm font-mono rounded ${
                              isDarkMode 
                                ? 'bg-gray-700 text-gray-300 border border-gray-600' 
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}