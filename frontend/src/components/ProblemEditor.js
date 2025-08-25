import React, { useState } from 'react';
import { X, Check, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from './DarkModeWrapper';

function ProblemEditor({ problem, onSave, onCancel, index }) {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [editedProblem, setEditedProblem] = useState({
    ...problem,
    choices: problem.choices || []
  });
  const [errors, setErrors] = useState({});

  const validateProblem = () => {
    const newErrors = {};
    
    if (!editedProblem.question.trim()) {
      newErrors.question = 'Question is required';
    }
    
    if (editedProblem.type === 'multiple-choice') {
      if (editedProblem.choices.length < 2) {
        newErrors.choices = 'At least 2 choices are required';
      }
      if (!editedProblem.answer || !editedProblem.choices.includes(editedProblem.answer)) {
        newErrors.answer = 'Answer must be one of the choices';
      }
    } else {
      if (!editedProblem.answer) {
        newErrors.answer = 'Answer is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateProblem()) {
      onSave(editedProblem);
    }
  };

  const addChoice = () => {
    setEditedProblem({
      ...editedProblem,
      choices: [...editedProblem.choices, '']
    });
  };

  const updateChoice = (idx, value) => {
    const newChoices = [...editedProblem.choices];
    newChoices[idx] = value;
    setEditedProblem({
      ...editedProblem,
      choices: newChoices
    });
  };

  const removeChoice = (idx) => {
    const newChoices = editedProblem.choices.filter((_, i) => i !== idx);
    setEditedProblem({
      ...editedProblem,
      choices: newChoices,
      // Reset answer if it was the removed choice
      answer: editedProblem.answer === editedProblem.choices[idx] ? '' : editedProblem.answer
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${darkMode.card} rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`p-6 border-b ${darkMode.border}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-bold ${darkMode.text}`}>
              Edit Problem {index + 1}
            </h2>
            <button onClick={onCancel} className={`p-2 ${darkMode.cardHover} rounded-lg`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Problem Type */}
            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Problem Type
              </label>
              <select
                value={editedProblem.type}
                onChange={(e) => setEditedProblem({ ...editedProblem, type: e.target.value })}
                className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="fill-in-blank">Fill in the Blank</option>
                <option value="short-answer">Short Answer</option>
                <option value="true-false">True/False</option>
              </select>
            </div>

            {/* Question */}
            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Question
              </label>
              <textarea
                value={editedProblem.question}
                onChange={(e) => setEditedProblem({ ...editedProblem, question: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.question ? 'border-red-500' : darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500 h-24`}
                placeholder="Enter the question..."
              />
              {errors.question && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.question}
                </p>
              )}
            </div>

            {/* Multiple Choice Options */}
            {editedProblem.type === 'multiple-choice' && (
              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                  Answer Choices
                </label>
                <div className="space-y-2">
                  {editedProblem.choices.map((choice, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`w-8 text-sm ${darkMode.textSecondary}`}>
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <input
                        type="text"
                        value={choice}
                        onChange={(e) => updateChoice(idx, e.target.value)}
                        className={`flex-1 px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                        placeholder={`Choice ${String.fromCharCode(65 + idx)}`}
                      />
                      <button
                        onClick={() => removeChoice(idx)}
                        className={`p-2 text-red-500 hover:bg-red-100 rounded`}
                        disabled={editedProblem.choices.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addChoice}
                  className={`mt-2 px-4 py-2 border ${darkMode.border} ${darkMode.cardHover} rounded-lg flex items-center gap-2`}
                >
                  <Plus className="w-4 h-4" />
                  Add Choice
                </button>
                {errors.choices && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.choices}
                  </p>
                )}
              </div>
            )}

            {/* Answer */}
            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Correct Answer
              </label>
              {editedProblem.type === 'multiple-choice' ? (
                <select
                  value={editedProblem.answer}
                  onChange={(e) => setEditedProblem({ ...editedProblem, answer: e.target.value })}
                  className={`w-full px-3 py-2 border ${errors.answer ? 'border-red-500' : darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  <option value="">Select correct answer</option>
                  {editedProblem.choices.map((choice, idx) => (
                    <option key={idx} value={choice}>
                      {String.fromCharCode(65 + idx)}. {choice}
                    </option>
                  ))}
                </select>
              ) : editedProblem.type === 'true-false' ? (
                <select
                  value={editedProblem.answer}
                  onChange={(e) => setEditedProblem({ ...editedProblem, answer: e.target.value })}
                  className={`w-full px-3 py-2 border ${errors.answer ? 'border-red-500' : darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  <option value="">Select answer</option>
                  <option value="True">True</option>
                  <option value="False">False</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={editedProblem.answer}
                  onChange={(e) => setEditedProblem({ ...editedProblem, answer: e.target.value })}
                  className={`w-full px-3 py-2 border ${errors.answer ? 'border-red-500' : darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                  placeholder="Enter the correct answer"
                />
              )}
              {errors.answer && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.answer}
                </p>
              )}
            </div>

            {/* Explanation */}
            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Explanation (Optional)
              </label>
              <textarea
                value={editedProblem.explanation || ''}
                onChange={(e) => setEditedProblem({ ...editedProblem, explanation: e.target.value })}
                className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500 h-20`}
                placeholder="Explain why this answer is correct..."
              />
            </div>

            {/* Topic */}
            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Topic (Optional)
              </label>
              <input
                type="text"
                value={editedProblem.topic || ''}
                onChange={(e) => setEditedProblem({ ...editedProblem, topic: e.target.value })}
                className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                placeholder="e.g., Fractions, Algebra, Geometry"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Difficulty
              </label>
              <select
                value={editedProblem.difficulty || 'medium'}
                onChange={(e) => setEditedProblem({ ...editedProblem, difficulty: e.target.value })}
                className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode.border}`}>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className={`px-4 py-2 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg font-medium`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemEditor;