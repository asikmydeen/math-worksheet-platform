import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Clock, 
  Send, 
  Save,
  ChevronLeft,
  ChevronRight,
  Award,
  RefreshCw
} from 'lucide-react';

function WorksheetSolver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worksheet, setWorksheet] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showHints, setShowHints] = useState({});
  const [currentProblem, setCurrentProblem] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (id && id !== 'undefined') {
      fetchWorksheet();
    } else {
      navigate('/worksheets');
    }
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const fetchWorksheet = async () => {
    try {
      const response = await api.get(`/worksheets/${id}`);
      setWorksheet(response.data.worksheet);
      
      // Initialize answers object
      const initialAnswers = {};
      response.data.worksheet.problems.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      console.error('Error fetching worksheet:', error);
      navigate('/worksheets');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (problemIndex, value) => {
    setAnswers({
      ...answers,
      [problemIndex]: value
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const answersArray = worksheet.problems.map((_, index) => ({
        userAnswer: answers[index],
        timeSpent: Math.floor(timeSpent / worksheet.problems.length)
      }));

      const response = await api.post(`/worksheets/${id}/submit`, {
        answers: answersArray,
        timeSpent
      });

      setResults(response.data);
      setWorksheet(response.data.worksheet);
    } catch (error) {
      console.error('Error submitting worksheet:', error);
      alert('Failed to submit worksheet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading worksheet...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!worksheet) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Worksheet not found</p>
          <button
            onClick={() => navigate('/worksheets')}
            className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            Back to Worksheets
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{worksheet.title}</h1>
              <p className="text-gray-600 mt-1">{worksheet.description}</p>
              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                <span>Grade {worksheet.grade}</span>
                <span>•</span>
                <span>{worksheet.problems.length} Problems</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(timeSpent)}
                </span>
              </div>
            </div>
            
            {results && (
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{results.score}%</div>
                <p className="text-sm text-gray-600">Score</p>
              </div>
            )}
          </div>
        </div>

        {/* Problem Navigation */}
        {!results && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentProblem(Math.max(0, currentProblem - 1))}
                disabled={currentProblem === 0}
                className="p-2 text-gray-600 hover:text-purple-600 disabled:text-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex space-x-2">
                {worksheet.problems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentProblem(index)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      currentProblem === index
                        ? 'bg-purple-500 text-white'
                        : answers[index]
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentProblem(Math.min(worksheet.problems.length - 1, currentProblem + 1))}
                disabled={currentProblem === worksheet.problems.length - 1}
                className="p-2 text-gray-600 hover:text-purple-600 disabled:text-gray-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Problem Display */}
        {!results ? (
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Problem {currentProblem + 1} of {worksheet.problems.length}
                </h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {worksheet.problems[currentProblem].topic}
                </span>
              </div>
              
              <div className="text-2xl font-medium text-gray-800 mb-6">
                {worksheet.problems[currentProblem].question}
              </div>
              
              <input
                type="text"
                value={answers[currentProblem] || ''}
                onChange={(e) => handleAnswerChange(currentProblem, e.target.value)}
                placeholder="Enter your answer"
                className="w-full px-4 py-3 text-xl border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                autoFocus
              />
              
              {/* Hints */}
              <div className="mt-4">
                <button
                  onClick={() => setShowHints({
                    ...showHints,
                    [currentProblem]: !showHints[currentProblem]
                  })}
                  className="flex items-center text-purple-600 hover:text-purple-700"
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  {showHints[currentProblem] ? 'Hide' : 'Show'} Hints
                </button>
                
                {showHints[currentProblem] && worksheet.problems[currentProblem].hints && (
                  <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="font-medium text-purple-800 mb-2">Hints:</p>
                    <ul className="space-y-1">
                      {worksheet.problems[currentProblem].hints.map((hint, idx) => (
                        <li key={idx} className="text-purple-700 text-sm">
                          • {hint}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Navigation and Submit */}
            <div className="flex justify-between items-center pt-6 border-t">
              <div className="flex space-x-2">
                {currentProblem > 0 && (
                  <button
                    onClick={() => setCurrentProblem(currentProblem - 1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex space-x-2">
                {currentProblem < worksheet.problems.length - 1 ? (
                  <button
                    onClick={() => setCurrentProblem(currentProblem + 1)}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    Next Problem
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 inline mr-2" />
                        Submit Worksheet
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center mb-8">
              <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {results.score >= 80 ? 'Great Job!' : results.score >= 60 ? 'Good Effort!' : 'Keep Practicing!'}
              </h2>
              <p className="text-xl text-gray-600">
                You scored <span className="font-bold text-purple-600">{results.score}%</span>
              </p>
            </div>
            
            <div className="space-y-4">
              {worksheet.problems.map((problem, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-2">
                        {index + 1}. {problem.question}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center">
                          Your answer: 
                          <span className={`ml-2 font-medium ${
                            problem.isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {problem.userAnswer || 'No answer'}
                          </span>
                        </span>
                        {!problem.isCorrect && (
                          <span className="flex items-center text-gray-600">
                            Correct answer: 
                            <span className="ml-2 font-medium text-green-600">
                              {problem.answer}
                            </span>
                          </span>
                        )}
                      </div>
                      
                      {!problem.isCorrect && problem.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>Explanation:</strong> {problem.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      {problem.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={() => navigate('/worksheets')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Back to Worksheets
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Generate New Worksheet
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default WorksheetSolver;
