import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from './DarkModeWrapper';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Award, Clock, 
  Brain, BookOpen, Zap, AlertCircle, CheckCircle,
  ChevronRight, Filter, Download
} from 'lucide-react';

function TopicAnalytics({ timeRange = 'month', grade = null }) {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [loading, setLoading] = useState(true);
  const [topicData, setTopicData] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [learningCurve, setLearningCurve] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchTopicAnalytics();
  }, [timeRange, grade]);

  useEffect(() => {
    if (selectedTopic) {
      fetchLearningCurve(selectedTopic);
    }
  }, [selectedTopic]);

  const fetchTopicAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ timeRange });
      if (grade) params.append('grade', grade);
      
      const response = await api.get(`/analytics/topics?${params}`);
      if (response.data.success) {
        setTopicData(response.data.analytics);
        if (response.data.analytics.length > 0) {
          setSelectedTopic(response.data.analytics[0].topic);
        }
      }
    } catch (error) {
      console.error('Error fetching topic analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningCurve = async (topic) => {
    try {
      const response = await api.get(`/analytics/learning-curve/${encodeURIComponent(topic)}`);
      if (response.data.success) {
        setLearningCurve(response.data.learningCurve);
      }
    } catch (error) {
      console.error('Error fetching learning curve:', error);
    }
  };

  const getMasteryColor = (mastery) => {
    switch (mastery) {
      case 'mastered': return '#10b981';
      case 'proficient': return '#3b82f6';
      case 'developing': return '#f59e0b';
      case 'needs_practice': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getMasteryIcon = (mastery) => {
    switch (mastery) {
      case 'mastered': return <Award className="w-5 h-5" />;
      case 'proficient': return <CheckCircle className="w-5 h-5" />;
      case 'developing': return <Target className="w-5 h-5" />;
      case 'needs_practice': return <AlertCircle className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m`;
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
          <p className={`mt-4 ${darkMode.textSecondary}`}>Loading topic analytics...</p>
        </div>
      </div>
    );
  }

  if (topicData.length === 0) {
    return (
      <div className={`${darkMode.card} rounded-xl shadow-sm p-8 text-center`}>
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold ${darkMode.text} mb-2`}>No Topic Data Available</h3>
        <p className={`${darkMode.textSecondary}`}>Complete some worksheets to see detailed topic analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Topic Performance List */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${darkMode.text}`}>Topic Performance</h3>
            <Filter className={`w-5 h-5 ${darkMode.textMuted}`} />
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {topicData.map((topic) => (
              <div
                key={topic.topic}
                onClick={() => setSelectedTopic(topic.topic)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedTopic === topic.topic
                    ? isDarkMode ? 'bg-purple-900/30 border-purple-500' : 'bg-purple-50 border-purple-500'
                    : isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                } border`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ color: getMasteryColor(topic.mastery) }}>
                      {getMasteryIcon(topic.mastery)}
                    </div>
                    <span className={`font-medium ${darkMode.text}`}>{topic.topic}</span>
                  </div>
                  {getTrendIcon(topic.performanceTrend)}
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className={`${darkMode.textSecondary}`}>
                    {topic.totalProblems} problems
                  </span>
                  <span className={`font-semibold ${
                    topic.accuracy >= 80 ? 'text-green-500' :
                    topic.accuracy >= 60 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {Math.round(topic.accuracy)}%
                  </span>
                </div>
                
                {/* Mini progress bar */}
                <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${topic.accuracy}%`,
                      backgroundColor: getMasteryColor(topic.mastery)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Topic Details */}
        {selectedTopic && (
          <div className={`lg:col-span-2 ${darkMode.card} rounded-xl shadow-sm p-6`}>
            <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>
              {selectedTopic} - Detailed Analysis
            </h3>
            
            {topicData.filter(t => t.topic === selectedTopic).map(topic => (
              <div key={topic.topic} className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${darkMode.textSecondary}`}>Accuracy</p>
                    <p className={`text-xl font-bold ${darkMode.text}`}>
                      {Math.round(topic.accuracy)}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${darkMode.textSecondary}`}>Avg Time</p>
                    <p className={`text-xl font-bold ${darkMode.text}`}>
                      {formatTime(topic.averageTimePerProblem)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${darkMode.textSecondary}`}>Worksheets</p>
                    <p className={`text-xl font-bold ${darkMode.text}`}>
                      {topic.worksheetCount}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${darkMode.textSecondary}`}>Mastery</p>
                    <p className={`text-xl font-bold capitalize`} style={{ color: getMasteryColor(topic.mastery) }}>
                      {topic.mastery.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Difficulty Breakdown */}
                <div>
                  <h4 className={`text-sm font-medium ${darkMode.text} mb-2`}>Difficulty Distribution</h4>
                  <div className="space-y-2">
                    {['easy', 'medium', 'hard'].map(difficulty => {
                      const count = topic.difficultyBreakdown[difficulty];
                      const percentage = topic.totalProblems > 0 
                        ? (count / topic.totalProblems) * 100 
                        : 0;
                      
                      return (
                        <div key={difficulty} className="flex items-center gap-3">
                          <span className={`text-sm ${darkMode.textSecondary} w-16 capitalize`}>
                            {difficulty}
                          </span>
                          <div className="flex-1 h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full flex items-center justify-end pr-2 text-xs text-white font-medium ${
                                difficulty === 'easy' ? 'bg-green-500' :
                                difficulty === 'medium' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            >
                              {count > 0 && count}
                            </div>
                          </div>
                          <span className={`text-sm ${darkMode.textMuted} w-12 text-right`}>
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Learning Curve */}
                {learningCurve && learningCurve.data.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${darkMode.text} mb-2`}>Learning Progress</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={learningCurve.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                        <XAxis 
                          dataKey="index" 
                          stroke={chartTheme.axis}
                          label={{ value: 'Sessions', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke={chartTheme.axis}
                          domain={[0, 100]}
                          label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: chartTheme.tooltip.backgroundColor, 
                            border: `1px solid ${chartTheme.tooltip.borderColor}`,
                            color: chartTheme.tooltip.textColor 
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="#8b5cf6" 
                          fill="#8b5cf6" 
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    
                    {learningCurve.summary && (
                      <div className="mt-2 flex justify-between text-sm">
                        <span className={`${darkMode.textSecondary}`}>
                          Improvement: {learningCurve.summary.improvementRate > 0 ? '+' : ''}{Math.round(learningCurve.summary.improvementRate)}%
                        </span>
                        <span className={`${darkMode.textSecondary}`}>
                          Speed: {learningCurve.summary.timeEfficiency > 0 ? '+' : ''}{Math.round(learningCurve.summary.timeEfficiency)}% faster
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowDetail(!showDetail)}
          className={`flex items-center gap-2 px-4 py-2 ${darkMode.card} rounded-lg hover:shadow-md transition-all`}
        >
          <span className={`${darkMode.text}`}>View All Topics Report</span>
          <ChevronRight className={`w-4 h-4 ${showDetail ? 'rotate-90' : ''} transition-transform`} />
        </button>
        
        <button
          className={`flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600`}
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </div>
  );
}

export default TopicAnalytics;