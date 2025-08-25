import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from './DarkModeWrapper';
import { CheckCircle, XCircle } from 'lucide-react';

function ProblemRenderer({ problem, index, onAnswer, showResult, isReview }) {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [userAnswer, setUserAnswer] = useState(problem.userAnswer || '');
  const [matchingAnswers, setMatchingAnswers] = useState({});

  // Reset state when problem changes
  useEffect(() => {
    setUserAnswer(problem.userAnswer || '');
    setMatchingAnswers({});
  }, [problem, index]);

  const handleAnswer = (answer) => {
    setUserAnswer(answer);
    if (onAnswer) {
      onAnswer(answer);
    }
  };

  const handleMatchingAnswer = (leftItem, rightItem) => {
    const newAnswers = { ...matchingAnswers, [leftItem]: rightItem };
    setMatchingAnswers(newAnswers);
    
    // Check if all pairs are matched
    if (problem.matchingPairs && Object.keys(newAnswers).length === problem.matchingPairs.length) {
      if (onAnswer) {
        onAnswer(newAnswers);
      }
    }
  };

  const isCorrect = () => {
    if (!showResult) return null;
    
    switch (problem.type) {
      case 'multiple-choice':
      case 'fill-in-blank':
      case 'short-answer':
        return problem.userAnswer === problem.answer;
      
      case 'true-false':
        return problem.userAnswer?.toLowerCase() === problem.answer?.toLowerCase();
      
      case 'matching':
        if (!problem.matchingPairs || !problem.userAnswer) return false;
        return problem.matchingPairs.every(pair => 
          problem.userAnswer[pair.left] === pair.right
        );
      
      default:
        return false;
    }
  };

  const renderMultipleChoice = () => {
    const choices = problem.choices || problem.options || [];
    
    return (
      <div className="space-y-3 mt-4">
        {choices.map((choice, idx) => {
          const isSelected = userAnswer === choice;
          const isCorrectChoice = showResult && choice === problem.answer;
          const isWrong = showResult && isSelected && choice !== problem.answer;
          
          return (
            <button
              key={idx}
              onClick={() => !isReview && handleAnswer(choice)}
              disabled={isReview}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                isCorrectChoice
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : isWrong
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : isSelected
                  ? isDarkMode
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-purple-500 bg-purple-50'
                  : isDarkMode
                  ? 'border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-700'
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
              } ${isReview ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                isSelected 
                  ? 'border-purple-500 bg-purple-500' 
                  : 'border-gray-400'
              }`}>
                {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
              </div>
              <span className={`flex-1 ${darkMode.text}`}>
                {String.fromCharCode(65 + idx)}. {choice}
              </span>
              {showResult && (
                isCorrectChoice ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isWrong ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : null
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderFillInBlank = () => {
    const questionParts = problem.question.split('_____');
    
    return (
      <div className="mt-4">
        <div className={`text-lg ${darkMode.text} mb-4`}>
          {questionParts[0]}
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswer(e.target.value)}
            disabled={isReview}
            className={`mx-2 px-3 py-1 border-b-2 bg-transparent text-center min-w-[100px] ${
              showResult
                ? isCorrect()
                  ? 'border-green-500 text-green-600'
                  : 'border-red-500 text-red-600'
                : 'border-purple-500'
            } ${darkMode.inputText} focus:outline-none`}
            placeholder="?"
          />
          {questionParts[1]}
        </div>
        {showResult && !isCorrect() && (
          <p className={`text-sm ${darkMode.textSecondary} mt-2`}>
            Correct answer: <span className="font-medium text-green-600">{problem.answer}</span>
          </p>
        )}
      </div>
    );
  };

  const renderTrueFalse = () => {
    return (
      <div className="mt-4 flex gap-4">
        {['True', 'False'].map((option) => {
          const isSelected = userAnswer.toLowerCase() === option.toLowerCase();
          const isCorrectChoice = showResult && option.toLowerCase() === problem.answer?.toLowerCase();
          const isWrong = showResult && isSelected && option.toLowerCase() !== problem.answer?.toLowerCase();
          
          return (
            <button
              key={option}
              onClick={() => !isReview && handleAnswer(option)}
              disabled={isReview}
              className={`flex-1 p-4 rounded-lg border-2 transition-all font-medium ${
                isCorrectChoice
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : isWrong
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : isSelected
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : isDarkMode
                  ? 'border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700'
              } ${isReview ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    );
  };

  const renderShortAnswer = () => {
    return (
      <div className="mt-4">
        <textarea
          value={userAnswer}
          onChange={(e) => handleAnswer(e.target.value)}
          disabled={isReview}
          rows={3}
          className={`w-full p-3 border-2 rounded-lg resize-none ${
            showResult
              ? isCorrect()
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-700'
          } ${darkMode.inputBg} ${darkMode.inputText} focus:outline-none focus:border-purple-500`}
          placeholder="Type your answer here..."
        />
        {showResult && (
          <div className="mt-3">
            <p className={`text-sm font-medium ${darkMode.text} mb-1`}>Model Answer:</p>
            <p className={`text-sm ${darkMode.textSecondary} p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {problem.answer}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderMatching = () => {
    if (!problem.matchingPairs) return null;
    
    const leftItems = problem.matchingPairs.map(pair => pair.left);
    // Create a stable shuffled array using the problem index as seed
    const rightItems = [...problem.matchingPairs.map(pair => pair.right)];
    // Simple deterministic shuffle based on problem content
    const seed = problem.question.length + index;
    rightItems.sort((a, b) => {
      const hashA = a.charCodeAt(0) + seed;
      const hashB = b.charCodeAt(0) + seed;
      return hashA - hashB;
    });
    
    return (
      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className={`font-medium ${darkMode.text} mb-2`}>Items</h4>
            {leftItems.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 mb-2 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}
              >
                <span className={`${darkMode.text}`}>{item}</span>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className={`font-medium ${darkMode.text} mb-2`}>Match With</h4>
            {leftItems.map((leftItem, idx) => (
              <div key={idx} className="mb-2">
                <select
                  value={matchingAnswers[leftItem] || ''}
                  onChange={(e) => handleMatchingAnswer(leftItem, e.target.value)}
                  disabled={isReview}
                  className={`w-full p-3 rounded-lg border ${
                    showResult
                      ? matchingAnswers[leftItem] === problem.matchingPairs.find(p => p.left === leftItem)?.right
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-300 dark:border-gray-700'
                  } ${darkMode.inputBg} ${darkMode.inputText} focus:outline-none focus:border-purple-500`}
                >
                  <option value="">Select match for: {leftItem}</option>
                  {rightItems.map((rightItem, ridx) => (
                    <option key={ridx} value={rightItem}>{rightItem}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const correct = isCorrect();

  return (
    <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ${
      showResult 
        ? correct 
          ? 'border-2 border-green-500' 
          : 'border-2 border-red-500'
        : 'border border-gray-300 dark:border-gray-700'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-lg font-medium ${darkMode.text}`}>
          Question {index + 1}
          {problem.topic && (
            <span className={`ml-2 text-sm px-2 py-1 rounded ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
              {problem.topic}
            </span>
          )}
        </h3>
        {showResult && (
          correct ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <XCircle className="w-6 h-6 text-red-500" />
          )
        )}
      </div>

      <p className={`text-lg ${darkMode.text} mb-4`}>{problem.question}</p>

      {problem.type === 'multiple-choice' && renderMultipleChoice()}
      {problem.type === 'fill-in-blank' && renderFillInBlank()}
      {problem.type === 'true-false' && renderTrueFalse()}
      {problem.type === 'short-answer' && renderShortAnswer()}
      {problem.type === 'matching' && renderMatching()}

      {showResult && problem.explanation && (
        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <p className={`text-sm ${darkMode.textSecondary}`}>
            <span className="font-medium">Explanation:</span> {problem.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

export default ProblemRenderer;