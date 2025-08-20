import { useTheme } from '../contexts/ThemeContext';

export const DarkModeWrapper = ({ children, className = '', darkClassName = '' }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`${className} ${isDarkMode ? darkClassName : ''}`}>
      {children}
    </div>
  );
};

export const useDarkModeClasses = () => {
  const { isDarkMode } = useTheme();
  
  return {
    card: isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white',
    cardHover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    borderDashed: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    inputBg: isDarkMode ? 'bg-gray-700' : 'bg-white',
    inputBorder: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    inputText: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    buttonPrimary: 'bg-purple-600 hover:bg-purple-700 text-white',
    buttonSecondary: isDarkMode 
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600' 
      : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
  };
};