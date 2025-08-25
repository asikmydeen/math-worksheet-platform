import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, BookOpen, Sparkles, Loader, Info, Clock, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDarkModeClasses } from './DarkModeWrapper';
import WorksheetPreview from './WorksheetPreview';

function WorksheetGenerator({ onClose, onGenerate, userGrade }) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const darkMode = useDarkModeClasses();
  const [mode, setMode] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [adaptiveInfo, setAdaptiveInfo] = useState(null);
  const [loadingAdaptive, setLoadingAdaptive] = useState(false);
  
  // Load draft from localStorage
  const loadDraft = () => {
    const savedDraft = localStorage.getItem('worksheetDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        return {
          ...parsed,
          topics: parsed.topics || [],
          problemTypes: parsed.problemTypes || []
        };
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
    return null;
  };
  
  const [formData, setFormData] = useState(() => {
    const draft = loadDraft();
    const defaultFormData = {
      subject: 'Math',
      grade: userGrade || '5',
      problemCount: 10,
      topics: [],
      difficulty: 'medium',
      title: '',
      naturalLanguageRequest: '',
      problemTypes: [],
      timerEnabled: false,
      timeLimit: 30
    };
    
    // Ensure problemTypes is always an array even if draft is corrupted
    if (draft) {
      return {
        ...defaultFormData,
        ...draft,
        topics: Array.isArray(draft.topics) ? draft.topics : [],
        problemTypes: Array.isArray(draft.problemTypes) ? draft.problemTypes : []
      };
    }
    
    return defaultFormData;
  });
  
  // Auto-save draft
  React.useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('worksheetDraft', JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    }, 1000);
    
    return () => clearTimeout(saveTimer);
  }, [formData]);

  const subjects = [
    'Math', 'Science', 'English', 'History', 'Geography', 
    'Language', 'Computer Science', 'Biology', 'Chemistry', 
    'Physics', 'Literature', 'Writing', 'Social Studies',
    'Art', 'Music', 'Physical Education', 'General'
  ];

  const subjectTopics = {
    'Math': ['Addition', 'Subtraction', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Algebra', 'Geometry', 'Word Problems', 'Percentages'],
    'Science': ['Biology', 'Chemistry', 'Physics', 'Earth Science', 'Experiments', 'Scientific Method', 'Energy', 'Matter', 'Forces', 'Ecosystems'],
    'English': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Spelling', 'Literature', 'Poetry', 'Essay Writing', 'Parts of Speech', 'Punctuation'],
    'History': ['Ancient History', 'World History', 'American History', 'European History', 'Wars', 'Civilizations', 'Important Figures', 'Timeline Events', 'Cultural History', 'Modern History'],
    'Geography': ['Countries', 'Capitals', 'Continents', 'Oceans', 'Mountains', 'Rivers', 'Climate', 'Maps', 'Cultures', 'Physical Features'],
    'Language': ['Vocabulary', 'Grammar', 'Conversation', 'Translation', 'Pronunciation', 'Writing', 'Reading', 'Listening', 'Culture', 'Idioms'],
    'Computer Science': ['Programming', 'Algorithms', 'Data Structures', 'Web Development', 'Databases', 'Networks', 'Cybersecurity', 'AI/ML', 'Software Design', 'Logic'],
    'Biology': ['Cells', 'Genetics', 'Evolution', 'Ecology', 'Anatomy', 'Plants', 'Animals', 'Microorganisms', 'Life Processes', 'Classification'],
    'Chemistry': ['Elements', 'Compounds', 'Reactions', 'Periodic Table', 'Acids & Bases', 'Organic Chemistry', 'States of Matter', 'Chemical Bonds', 'Stoichiometry', 'Lab Safety'],
    'Physics': ['Motion', 'Forces', 'Energy', 'Waves', 'Electricity', 'Magnetism', 'Thermodynamics', 'Optics', 'Quantum', 'Relativity'],
    'Literature': ['Poetry Analysis', 'Novel Study', 'Short Stories', 'Shakespeare', 'Literary Devices', 'Themes', 'Character Analysis', 'Plot Structure', 'Genre Study', 'Critical Reading'],
    'Writing': ['Creative Writing', 'Essay Structure', 'Narrative', 'Persuasive', 'Descriptive', 'Research Papers', 'Citations', 'Editing', 'Style', 'Voice'],
    'Social Studies': ['Government', 'Economics', 'Culture', 'Society', 'Current Events', 'Civics', 'Human Rights', 'Global Issues', 'Community', 'Democracy'],
    'Art': ['Color Theory', 'Drawing', 'Painting', 'Sculpture', 'Art History', 'Famous Artists', 'Techniques', 'Composition', 'Styles', 'Critique'],
    'Music': ['Music Theory', 'Instruments', 'Composers', 'Genres', 'Rhythm', 'Melody', 'Harmony', 'Music History', 'Notation', 'Performance'],
    'Physical Education': ['Sports Rules', 'Fitness', 'Health', 'Nutrition', 'Anatomy', 'Team Sports', 'Individual Sports', 'Safety', 'Exercise', 'Wellness'],
    'General': ['Critical Thinking', 'Problem Solving', 'Logic', 'Research Skills', 'Study Skills', 'Time Management', 'Communication', 'Collaboration', 'Creativity', 'Analysis']
  };

  const getTopicsForSubject = () => {
    return subjectTopics[formData.subject] || subjectTopics['General'];
  };

  // Fetch adaptive difficulty info
  const fetchAdaptiveInfo = async () => {
    if (formData.difficulty !== 'adaptive') {
      setAdaptiveInfo(null);
      return;
    }

    setLoadingAdaptive(true);
    try {
      const params = new URLSearchParams({
        subject: formData.subject,
        grade: formData.grade,
        topics: formData.topics.join(',')
      });
      
      const response = await api.get(`/worksheets/adaptive-difficulty?${params}`);
      if (response.data.success) {
        setAdaptiveInfo(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch adaptive info:', err);
    } finally {
      setLoadingAdaptive(false);
    }
  };

  // Fetch adaptive info when relevant fields change
  useEffect(() => {
    if (formData.difficulty === 'adaptive') {
      const timer = setTimeout(() => {
        fetchAdaptiveInfo();
      }, 500); // Debounce
      return () => clearTimeout(timer);
    }
  }, [formData.difficulty, formData.subject, formData.grade, formData.topics]);

  const handleGenerate = async () => {
    setError('');
    setLoading(true);

    try {
      // First, generate the problems but don't save yet
      const response = await api.post('/worksheets/generate-preview', formData);
      
      if (response.data.success) {
        // Show preview instead of immediately creating
        setPreviewData(response.data.preview);
        setShowPreview(true);
      }
    } catch (err) {
      // If preview endpoint doesn't exist, fall back to direct generation
      if (err.response?.status === 404) {
        try {
          const response = await api.post('/worksheets/generate', formData);
          if (response.data.success) {
            localStorage.removeItem('worksheetDraft');
            onGenerate(response.data.worksheet);
            onClose();
          }
        } catch (fallbackErr) {
          handleGenerateError(fallbackErr);
        }
      } else {
        handleGenerateError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateError = (err) => {
    if (err.response?.status === 429) {
      // Rate limiting error
      const retryAfter = err.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 60;
      setError(`Too many requests. Please wait ${waitTime} seconds before trying again.`);
    } else if (err.response?.data?.requiresSubscription) {
      window.location.href = '/#pricing';
    } else {
      setError(err.response?.data?.message || 'Failed to generate worksheet');
    }
  };

  const handlePreviewConfirm = async (finalWorksheet) => {
    setLoading(true);
    try {
      const response = await api.post('/worksheets/create-from-preview', finalWorksheet);
      if (response.data.success) {
        localStorage.removeItem('worksheetDraft');
        onGenerate(response.data.worksheet);
        onClose();
      }
    } catch (err) {
      // Fall back to regular generation if preview endpoints don't exist
      if (err.response?.status === 404) {
        try {
          const response = await api.post('/worksheets/generate', { ...formData, title: finalWorksheet.title });
          if (response.data.success) {
            localStorage.removeItem('worksheetDraft');
            onGenerate(response.data.worksheet);
            onClose();
          }
        } catch (fallbackErr) {
          handleGenerateError(fallbackErr);
        }
      } else {
        handleGenerateError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (problemIndices) => {
    // This would regenerate specific problems
    // For now, just regenerate the whole worksheet
    setShowPreview(false);
    handleGenerate();
  };
  
  const handleClearDraft = () => {
    localStorage.removeItem('worksheetDraft');
    setFormData({
      subject: 'Math',
      grade: userGrade || '5',
      problemCount: 10,
      topics: [],
      difficulty: 'medium',
      title: '',
      naturalLanguageRequest: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className={`${darkMode.card} rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h2 className={`text-xl sm:text-2xl font-bold ${darkMode.text}`}>Generate New Worksheet</h2>
            {draftSaved && (
              <span className="text-sm text-green-500 animate-fade-in">Draft saved</span>
            )}
          </div>
          <button onClick={onClose} className={`p-2 ${darkMode.cardHover} rounded-lg`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className={`mb-4 p-3 ${isDarkMode ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-100 border-red-300 text-red-700'} rounded-lg flex items-start gap-2`}>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* AI Requests Info */}
        {user && (
          <div className={`mb-4 p-3 ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-100 border-blue-300 text-blue-700'} rounded-lg flex items-center gap-2`}>
            <Info className="w-5 h-5 shrink-0" />
            <span className="text-sm">
              AI Requests: {user.subscription?.aiRequestsUsed || 0} / {user.subscription?.aiRequestsLimit || 10} used this hour
              {user.subscription?.plan === 'free' && ' (Upgrade for more)'}
            </span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('standard')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'standard'
                  ? 'bg-purple-500 text-white'
                  : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Standard Mode
            </button>
            <button
              onClick={() => setMode('natural')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === 'natural'
                  ? 'bg-purple-500 text-white'
                  : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI Natural Language
            </button>
          </div>
        </div>

        {mode === 'standard' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value, topics: []})}
                  className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Grade Level</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Grade {i+1}</option>
                  ))}
                  <option value="College">College</option>
                  <option value="Adult">Adult</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Number of Problems</label>
                <select
                  value={formData.problemCount}
                  onChange={(e) => setFormData({...formData, problemCount: parseInt(e.target.value)})}
                  className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  <option value="5">5 Problems</option>
                  <option value="10">10 Problems</option>
                  <option value="15">15 Problems</option>
                  <option value="20">20 Problems</option>
                  <option value="25">25 Problems</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  <option value="adaptive">Adaptive (Recommended)</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            {formData.difficulty === 'adaptive' && adaptiveInfo && (
              <div className={`col-span-2 p-3 rounded-lg ${isDarkMode ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-300'} border`}>
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${darkMode.text} mb-1`}>
                      Adaptive Difficulty: {adaptiveInfo.difficulty.charAt(0).toUpperCase() + adaptiveInfo.difficulty.slice(1)}
                    </p>
                    <p className={`text-xs ${darkMode.textSecondary}`}>
                      {adaptiveInfo.reason}
                    </p>
                    {adaptiveInfo.metrics && (
                      <p className={`text-xs ${darkMode.textSecondary} mt-1`}>
                        Based on {adaptiveInfo.metrics.recentWorksheetsAnalyzed} recent worksheets 
                        (avg score: {adaptiveInfo.metrics.weightedAverageScore}%)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.difficulty === 'adaptive' && loadingAdaptive && (
              <div className={`col-span-2 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} flex items-center justify-center`}>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                <span className={`text-sm ${darkMode.textSecondary}`}>Analyzing performance...</span>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Topics (Optional)</label>
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 border ${darkMode.border} ${darkMode.inputBg} rounded-lg`}>
                {getTopicsForSubject().map(topic => (
                  <label key={topic} className={`flex items-center space-x-2 cursor-pointer ${darkMode.cardHover} p-1 rounded`}>
                    <input
                      type="checkbox"
                      checked={formData.topics.includes(topic)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, topics: [...formData.topics, topic]});
                        } else {
                          setFormData({...formData, topics: formData.topics.filter(t => t !== topic)});
                        }
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span className={`text-sm ${darkMode.text}`}>{topic}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Problem Types (Optional)</label>
              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-2 border ${darkMode.border} ${darkMode.inputBg} rounded-lg`}>
                {[
                  { id: 'multiple-choice', label: 'Multiple Choice' },
                  { id: 'fill-in-blank', label: 'Fill in the Blank' },
                  { id: 'true-false', label: 'True/False' },
                  { id: 'short-answer', label: 'Short Answer' },
                  { id: 'matching', label: 'Matching' }
                ].map(type => (
                  <label key={type.id} className={`flex items-center space-x-2 cursor-pointer ${darkMode.cardHover} p-1 rounded`}>
                    <input
                      type="checkbox"
                      checked={formData.problemTypes?.includes(type.id) || false}
                      onChange={(e) => {
                        const currentTypes = formData.problemTypes || [];
                        if (e.target.checked) {
                          setFormData({...formData, problemTypes: [...currentTypes, type.id]});
                        } else {
                          setFormData({...formData, problemTypes: currentTypes.filter(t => t !== type.id)});
                        }
                      }}
                      className="rounded text-purple-500 focus:ring-purple-500"
                    />
                    <span className={`text-sm ${darkMode.text}`}>{type.label}</span>
                  </label>
                ))}
              </div>
              <p className={`text-xs ${darkMode.textMuted} mt-1`}>
                Leave empty for automatic mix of problem types
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Worksheet Title (Optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder={`e.g., ${formData.subject} Practice for Week 5`}
                className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Timer Settings</label>
              <div className={`p-3 border ${darkMode.border} ${darkMode.inputBg} rounded-lg space-y-3`}>
                <label className={`flex items-center space-x-2 cursor-pointer`}>
                  <input
                    type="checkbox"
                    checked={formData.timerEnabled}
                    onChange={(e) => setFormData({...formData, timerEnabled: e.target.checked})}
                    className="rounded text-purple-500 focus:ring-purple-500"
                  />
                  <span className={`text-sm ${darkMode.text}`}>Enable timer for this worksheet</span>
                </label>
                
                {formData.timerEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-medium ${darkMode.textSecondary} mb-1`}>Time Limit (minutes)</label>
                      <select
                        value={formData.timeLimit}
                        onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                        className={`w-full px-2 py-1 text-sm border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded focus:outline-none focus:border-purple-500`}
                      >
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="20">20 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <p className={`text-xs ${darkMode.textSecondary}`}>
                        Students will see a countdown timer during practice
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>Grade Level</label>
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:border-purple-500`}
                >
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>Grade {i+1}</option>
                  ))}
                  <option value="College">College</option>
                  <option value="Adult">Adult</option>
                </select>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode.text} mb-1`}>
                Describe what you want in natural language
              </label>
              <textarea
                value={formData.naturalLanguageRequest}
                onChange={(e) => setFormData({...formData, naturalLanguageRequest: e.target.value})}
                placeholder={`Example: Create 10 ${formData.subject.toLowerCase()} problems about ${
                  formData.subject === 'Math' ? 'real-world applications involving percentages and discounts' :
                  formData.subject === 'Science' ? 'the solar system and planets with focus on their characteristics' :
                  formData.subject === 'English' ? 'identifying parts of speech and sentence structure' :
                  formData.subject === 'History' ? 'major events of World War II and their significance' :
                  'key concepts and practical applications'
                }...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 h-32 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about topics, question types, and any special requirements. The AI will generate problems based on your description.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-700">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Tips for {formData.subject}: 
                {formData.subject === 'Math' && ' Mention specific operations, word problems, or real-world contexts'}
                {formData.subject === 'Science' && ' Include experiments, concepts, or phenomena you want to explore'}
                {formData.subject === 'English' && ' Specify grammar rules, vocabulary themes, or reading skills'}
                {formData.subject === 'History' && ' Name specific events, time periods, or historical figures'}
                {!['Math', 'Science', 'English', 'History'].includes(formData.subject) && ' Be specific about the topics and concepts you want to cover'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || (mode === 'natural' && !formData.naturalLanguageRequest)}
            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {formData.subject} Worksheet
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-6 py-3 ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg font-semibold transition-all disabled:opacity-50`}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Worksheet Preview Modal */}
      {showPreview && previewData && (
        <WorksheetPreview
          worksheet={previewData}
          onConfirm={handlePreviewConfirm}
          onCancel={() => {
            setShowPreview(false);
            setPreviewData(null);
          }}
          onRegenerate={handleRegenerate}
          onEdit={() => {
            // Future: Implement problem editing
            setShowPreview(false);
          }}
        />
      )}
    </div>
  );
}

export default WorksheetGenerator;
