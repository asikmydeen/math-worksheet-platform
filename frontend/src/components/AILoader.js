import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Brain, Sparkles, Cpu, Zap, BookOpen, PenTool, Lightbulb, Target, Rocket, Stars } from 'lucide-react';

const loadingMessages = [
  { text: "AI is analyzing the curriculum...", icon: Brain },
  { text: "Creating age-appropriate problems...", icon: Target },
  { text: "Generating creative questions...", icon: Lightbulb },
  { text: "Balancing difficulty levels...", icon: Zap },
  { text: "Adding educational value...", icon: BookOpen },
  { text: "Crafting engaging content...", icon: PenTool },
  { text: "Optimizing learning experience...", icon: Rocket },
  { text: "Almost ready with your worksheet...", icon: Stars },
  { text: "Finalizing problem set...", icon: Sparkles },
  { text: "Running quality checks...", icon: Cpu }
];

function AILoader({ subject = "worksheet", problemCount = 10 }) {
  const { isDarkMode } = useTheme();
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2500);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const currentMessage = loadingMessages[messageIndex];
  const Icon = currentMessage.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className={`
        ${isDarkMode ? 'bg-gray-900' : 'bg-white'} 
        rounded-2xl shadow-2xl p-8 max-w-md w-full
        transform transition-all duration-300 scale-100
      `}>
        {/* Animated Icon Container */}
        <div className="relative mb-8">
          {/* Rotating background circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-purple-500/20 animate-spin-slow"></div>
            <div className="absolute w-24 h-24 rounded-full border-2 border-pink-500/20 animate-spin-reverse"></div>
            <div className="absolute w-16 h-16 rounded-full border-2 border-blue-500/20 animate-spin-slow"></div>
          </div>
          
          {/* Main icon with pulse effect */}
          <div className="relative flex items-center justify-center h-32">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse opacity-20"></div>
            </div>
            <Icon className="w-12 h-12 text-purple-600 dark:text-purple-400 relative z-10 animate-float" />
          </div>

          {/* Orbiting particles */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full animate-orbit"></div>
            <div className="absolute top-1/2 right-0 w-2 h-2 bg-pink-500 rounded-full animate-orbit-delayed"></div>
            <div className="absolute bottom-0 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-orbit-reverse"></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            Generating Your {subject} Worksheet
          </h3>
          
          <div className="space-y-2">
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} transition-all duration-500`}>
              {currentMessage.text}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Creating {problemCount} unique problems...
            </p>
          </div>

          {/* Progress bar */}
          <div className="relative pt-4">
            <div className={`h-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
              </div>
            </div>
            <div className="flex justify-between mt-2">
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {Math.round(progress)}%
              </span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Almost there...
              </span>
            </div>
          </div>

          {/* Fun fact or tip */}
          <div className={`mt-6 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <Sparkles className="w-3 h-3 inline mr-1" />
              Did you know? Our AI analyzes thousands of educational patterns to create the perfect worksheet for your grade level!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AILoader;