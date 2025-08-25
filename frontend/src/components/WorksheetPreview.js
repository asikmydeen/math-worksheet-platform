import React, { useState } from 'react';
import { X, Check, Edit2, RefreshCw, FileText, Clock, Hash } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from './DarkModeWrapper';
import ProblemEditor from './ProblemEditor';

function WorksheetPreview({ worksheet, onConfirm, onCancel, onRegenerate, onEdit }) {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(worksheet.title || 'Untitled Worksheet');
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [editingProblem, setEditingProblem] = useState(null);
  const [problems, setProblems] = useState(worksheet.problems || []);

  const handleTitleEdit = () => {
    if (editingTitle && title !== worksheet.title) {
      worksheet.title = title;
    }
    setEditingTitle(!editingTitle);
  };

  const toggleProblemSelection = (index) => {
    if (selectedProblems.includes(index)) {
      setSelectedProblems(selectedProblems.filter(i => i !== index));
    } else {
      setSelectedProblems([...selectedProblems, index]);
    }
  };

  const handleRegenerateSelected = () => {
    if (selectedProblems.length > 0) {
      onRegenerate(selectedProblems);
    }
  };

  const formatProblemType = (type) => {
    switch(type) {
      case 'multiple-choice': return 'Multiple Choice';
      case 'fill-in-blank': return 'Fill in the Blank';
      case 'word-problem': return 'Word Problem';
      case 'true-false': return 'True/False';
      case 'short-answer': return 'Short Answer';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode.card} rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${darkMode.border}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`text-2xl font-bold px-2 py-1 border rounded ${darkMode.inputBg} ${darkMode.inputBorder} ${darkMode.inputText}`}
                    autoFocus
                  />
                  <button
                    onClick={handleTitleEdit}
                    className="p-2 text-green-500 hover:bg-green-100 rounded"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className={`text-2xl font-bold ${darkMode.text}`}>{title}</h2>
                  <button
                    onClick={handleTitleEdit}
                    className={`p-2 ${darkMode.cardHover} rounded`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className={`mt-1 ${darkMode.textSecondary}`}>
                Preview your worksheet before finalizing
              </p>
            </div>
            <button onClick={onCancel} className={`p-2 ${darkMode.cardHover} rounded-lg`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Worksheet Info */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <span className={`text-sm ${darkMode.text}`}>
                {worksheet.subject} - Grade {worksheet.grade}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" />
              <span className={`text-sm ${darkMode.text}`}>
                {worksheet.problems?.length || 0} Problems
              </span>
            </div>
            {worksheet.difficulty && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                <span className={`text-sm ${darkMode.text}`}>
                  Difficulty: {worksheet.difficulty}
                </span>
              </div>
            )}
          </div>

          {/* Topics */}
          {worksheet.topics && worksheet.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {worksheet.topics.map((topic, idx) => (
                <span 
                  key={idx} 
                  className={`px-3 py-1 text-xs rounded-full ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Bar */}
        {selectedProblems.length > 0 && (
          <div className={`p-4 border-b ${darkMode.border} bg-yellow-50 dark:bg-yellow-900/20`}>
            <div className="flex justify-between items-center">
              <span className={`${darkMode.text}`}>
                {selectedProblems.length} problem{selectedProblems.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerateSelected}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Selected
                </button>
                <button
                  onClick={() => setSelectedProblems([])}
                  className={`px-4 py-2 ${darkMode.cardHover} rounded-lg`}
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Problems List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {problems.map((problem, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedProblems.includes(index) 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : darkMode.border + ' ' + darkMode.cardHover
                }`}
                onClick={() => toggleProblemSelection(index)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${darkMode.text}`}>
                      Problem {index + 1}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      {formatProblemType(problem.type)}
                    </span>
                    {problem.topic && (
                      <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                        {problem.topic}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProblem(index);
                      }}
                      className={`p-2 ${darkMode.cardHover} rounded`}
                      title="Edit Problem"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <input
                      type="checkbox"
                      checked={selectedProblems.includes(index)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleProblemSelection(index);
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <p className={`mb-3 ${darkMode.text}`}>{problem.question}</p>

                {/* Multiple Choice Options */}
                {problem.type === 'multiple-choice' && problem.choices && (
                  <div className="space-y-2 mb-3">
                    {problem.choices.map((choice, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded ${
                          choice === problem.answer 
                            ? isDarkMode ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'
                            : isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                        } border`}
                      >
                        <span className={`${darkMode.text}`}>
                          {String.fromCharCode(65 + idx)}. {choice}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer */}
                <div className={`text-sm ${darkMode.textSecondary}`}>
                  <span className="font-medium">Answer: </span>
                  <span className="text-green-600 dark:text-green-400">
                    {typeof problem.answer === 'object' ? JSON.stringify(problem.answer) : problem.answer}
                  </span>
                </div>

                {/* Explanation */}
                {problem.explanation && (
                  <div className={`mt-2 text-sm ${darkMode.textSecondary}`}>
                    <span className="font-medium">Explanation: </span>
                    {problem.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode.border}`}>
          <div className="flex justify-between items-center">
            <div className={`text-sm ${darkMode.textSecondary}`}>
              Review the problems above. You can select and regenerate specific problems if needed.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onRegenerate()}
                className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg font-medium flex items-center gap-2`}
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate All
              </button>
              <button
                onClick={() => onConfirm({ ...worksheet, title, problems })}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Editor Modal */}
      {editingProblem !== null && (
        <ProblemEditor
          problem={problems[editingProblem]}
          index={editingProblem}
          onSave={(updatedProblem) => {
            const newProblems = [...problems];
            newProblems[editingProblem] = updatedProblem;
            setProblems(newProblems);
            setEditingProblem(null);
          }}
          onCancel={() => setEditingProblem(null)}
        />
      )}
    </div>
  );
}

export default WorksheetPreview;