import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import {
  Trophy, Users, TrendingUp, Award, Target,
  ChevronUp, ChevronDown, Medal, Star, Brain, Clock
} from 'lucide-react';

function ComparativeAnalytics({ grade }) {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [loading, setLoading] = useState(true);
  const [comparativeData, setComparativeData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    fetchComparativeData();
    fetchRecommendations();
  }, [grade]);

  const fetchComparativeData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (grade) params.append('grade', grade);
      
      const response = await api.get(`/analytics/comparative?${params}`);
      if (response.data.success) {
        setComparativeData(response.data.comparative);
      }
    } catch (error) {
      console.error('Error fetching comparative analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await api.get('/analytics/recommendations');
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  // Chart theme configuration
  const chartTheme = {
    axis: isDarkMode ? '#9ca3af' : '#6b7280',
    grid: isDarkMode ? '#374151' : '#e5e7eb',
    text: isDarkMode ? '#d1d5db' : '#374151',
    tooltip: {
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      textColor: isDarkMode ? '#d1d5db' : '#374151'
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`mt-4 ${darkMode.textSecondary}`}>Loading comparative analytics...</p>
        </div>
      </div>
    );
  }

  if (!comparativeData) {
    return (
      <div className={`${darkMode.card} rounded-xl shadow-sm p-8 text-center`}>
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold ${darkMode.text} mb-2`}>No Comparative Data Available</h3>
        <p className={`${darkMode.textSecondary}`}>Complete more worksheets to see how you compare with others.</p>
      </div>
    );
  }

  const getRankIcon = (ranking) => {
    if (!ranking || ranking.total === 0) return null;
    const percentile = ((ranking.total - ranking.ranking + 1) / ranking.total) * 100;
    
    if (percentile >= 90) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (percentile >= 75) return <Medal className="w-5 h-5 text-gray-400" />;
    if (percentile >= 50) return <Star className="w-5 h-5 text-orange-600" />;
    return null;
  };

  const getPercentileColor = (percentile) => {
    if (percentile >= 90) return '#10b981';
    if (percentile >= 75) return '#3b82f6';
    if (percentile >= 50) return '#f59e0b';
    if (percentile >= 25) return '#ef4444';
    return '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Overall Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Your Performance */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${darkMode.text}`}>Your Performance</h3>
            {getRankIcon(comparativeData.overall.ranking)}
          </div>
          
          <div className="space-y-3">
            <div>
              <p className={`text-3xl font-bold ${darkMode.text}`}>
                {Math.round(comparativeData.overall.user.avgScore || 0)}%
              </p>
              <p className={`text-sm ${darkMode.textSecondary}`}>Average Score</p>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t ${darkMode.border}">
              <span className={`text-sm ${darkMode.textSecondary}`}>Worksheets</span>
              <span className={`font-medium ${darkMode.text}`}>
                {comparativeData.overall.user.totalWorksheets || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode.textSecondary}`}>Avg Time/Problem</span>
              <span className={`font-medium ${darkMode.text}`}>
                {Math.round(comparativeData.overall.user.avgTimePerProblem || 0)}s
              </span>
            </div>
          </div>
        </div>

        {/* Class Average */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${darkMode.text}`}>Class Average</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="space-y-3">
            <div>
              <p className={`text-3xl font-bold ${darkMode.text}`}>
                {Math.round(comparativeData.overall.class.avgScore || 0)}%
              </p>
              <p className={`text-sm ${darkMode.textSecondary}`}>Average Score</p>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t ${darkMode.border}">
              <span className={`text-sm ${darkMode.textSecondary}`}>Total Students</span>
              <span className={`font-medium ${darkMode.text}`}>
                {comparativeData.overall.ranking?.total || 0}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`text-sm ${darkMode.textSecondary}`}>Avg Time/Problem</span>
              <span className={`font-medium ${darkMode.text}`}>
                {Math.round(comparativeData.overall.class.avgTimePerProblem || 0)}s
              </span>
            </div>
          </div>
        </div>

        {/* Your Ranking */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${darkMode.text}`}>Your Ranking</h3>
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          
          <div className="space-y-3">
            <div>
              <p className={`text-3xl font-bold ${darkMode.text}`}>
                #{comparativeData.overall.ranking?.ranking || '-'}
              </p>
              <p className={`text-sm ${darkMode.textSecondary}`}>
                out of {comparativeData.overall.ranking?.total || 0} students
              </p>
            </div>
            
            <div className="pt-3 border-t ${darkMode.border}">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm ${darkMode.textSecondary}`}>Performance vs Class</span>
                <span className={`font-medium flex items-center gap-1 ${
                  (comparativeData.overall.user.avgScore - comparativeData.overall.class.avgScore) > 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                  {(comparativeData.overall.user.avgScore - comparativeData.overall.class.avgScore) > 0 
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                  {Math.abs(comparativeData.overall.user.avgScore - comparativeData.overall.class.avgScore).toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  style={{ 
                    width: `${((comparativeData.overall.ranking?.total - comparativeData.overall.ranking?.ranking + 1) / comparativeData.overall.ranking?.total) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Comparison */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>Topic Performance Comparison</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparativeData.byTopic}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} stroke={chartTheme.axis} />
              <YAxis stroke={chartTheme.axis} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: chartTheme.tooltip.backgroundColor, 
                  border: `1px solid ${chartTheme.tooltip.borderColor}`,
                  color: chartTheme.tooltip.textColor 
                }} 
              />
              <Legend />
              <Bar dataKey="userAccuracy" name="You" fill="#8b5cf6" />
              <Bar dataKey="classAccuracy" name="Class Avg" fill="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Strengths and Improvements */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>Performance Analysis</h3>
          
          <div className="space-y-4">
            {/* Strengths */}
            <div>
              <h4 className={`font-medium ${darkMode.text} mb-2 flex items-center gap-2`}>
                <TrendingUp className="w-4 h-4 text-green-500" />
                Your Strengths
              </h4>
              <div className="space-y-2">
                {comparativeData.strengths.length > 0 ? (
                  comparativeData.strengths.map(topic => (
                    <div key={topic} className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                      <span className={`text-sm ${darkMode.text}`}>{topic}</span>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${darkMode.textSecondary}`}>Keep practicing to identify your strengths!</p>
                )}
              </div>
            </div>
            
            {/* Areas for Improvement */}
            <div>
              <h4 className={`font-medium ${darkMode.text} mb-2 flex items-center gap-2`}>
                <Target className="w-4 h-4 text-orange-500" />
                Areas for Improvement
              </h4>
              <div className="space-y-2">
                {comparativeData.improvements.length > 0 ? (
                  comparativeData.improvements.map(topic => (
                    <div key={topic} className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                      <span className={`text-sm ${darkMode.text}`}>{topic}</span>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm ${darkMode.textSecondary}`}>You're doing great! Keep up the good work.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Percentile Distribution */}
      <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>Your Percentile by Topic</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {comparativeData.byTopic.map(topic => (
            <div key={topic.topic} className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke={isDarkMode ? '#374151' : '#e5e7eb'}
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke={getPercentileColor(topic.percentile)}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(topic.percentile / 100) * 226} 226`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${darkMode.text}`}>
                    {topic.percentile}
                  </span>
                </div>
              </div>
              <p className={`text-sm font-medium ${darkMode.text}`}>{topic.topic}</p>
              <p className={`text-xs ${darkMode.textSecondary}`}>Percentile</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      {recommendations && recommendations.recommendations.length > 0 && (
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <h3 className={`text-lg font-semibold ${darkMode.text} mb-4 flex items-center gap-2`}>
            <Brain className="w-5 h-5 text-purple-500" />
            Personalized Recommendations
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.recommendations.map((rec, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                rec.type === 'practice' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                rec.type === 'challenge' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' :
                rec.type === 'schedule' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                'border-green-500 bg-green-50 dark:bg-green-900/20'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    rec.type === 'practice' ? 'bg-orange-500' :
                    rec.type === 'challenge' ? 'bg-purple-500' :
                    rec.type === 'schedule' ? 'bg-blue-500' :
                    'bg-green-500'
                  } text-white`}>
                    {rec.type === 'practice' ? <Target className="w-4 h-4" /> :
                     rec.type === 'challenge' ? <Trophy className="w-4 h-4" /> :
                     rec.type === 'schedule' ? <Clock className="w-4 h-4" /> :
                     <Award className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${darkMode.text} mb-1`}>
                      {rec.topic || rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                    </h4>
                    <p className={`text-sm ${darkMode.textSecondary}`}>{rec.reason}</p>
                    {rec.suggestedDifficulty && (
                      <p className={`text-xs mt-1 ${darkMode.textMuted}`}>
                        Suggested: {rec.estimatedProblems} {rec.suggestedDifficulty} problems
                      </p>
                    )}
                    {rec.target && (
                      <p className={`text-xs mt-1 font-medium ${darkMode.text}`}>
                        Goal: {rec.target}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComparativeAnalytics;