import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from './DarkModeWrapper';
import {
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from 'recharts';
import {
  TrendingUp, Info, Target, Clock, Brain, 
  ChevronDown, Activity, Zap
} from 'lucide-react';

function LearningCurveViz({ userId, selectedTopics = [] }) {
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [loading, setLoading] = useState(true);
  const [learningData, setLearningData] = useState({});
  const [viewMode, setViewMode] = useState('accuracy'); // accuracy, speed, combined
  const [showPrediction, setShowPrediction] = useState(false);

  useEffect(() => {
    if (selectedTopics.length > 0) {
      fetchLearningCurves();
    }
  }, [selectedTopics, userId]);

  const fetchLearningCurves = async () => {
    setLoading(true);
    try {
      const curves = {};
      
      for (const topic of selectedTopics) {
        const response = await api.get(`/analytics/learning-curve/${encodeURIComponent(topic)}`);
        if (response.data.success) {
          curves[topic] = response.data.learningCurve;
        }
      }
      
      setLearningData(curves);
    } catch (error) {
      console.error('Error fetching learning curves:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate prediction data using simple regression
  const generatePrediction = (data) => {
    if (!data || data.length < 3) return [];
    
    // Simple linear regression for prediction
    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.index, 0);
    const sumY = data.reduce((sum, d) => sum + d.accuracy, 0);
    const sumXY = data.reduce((sum, d) => sum + d.index * d.accuracy, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.index * d.index, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate prediction for next 5 sessions
    const lastIndex = data[data.length - 1].index;
    const predictions = [];
    
    for (let i = 1; i <= 5; i++) {
      const predictedAccuracy = Math.min(100, Math.max(0, slope * (lastIndex + i) + intercept));
      predictions.push({
        index: lastIndex + i,
        accuracy: predictedAccuracy,
        isPrediction: true
      });
    }
    
    return predictions;
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

  const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className={`mt-4 ${darkMode.textSecondary}`}>Loading learning curves...</p>
        </div>
      </div>
    );
  }

  if (selectedTopics.length === 0) {
    return (
      <div className={`${darkMode.card} rounded-xl shadow-sm p-8 text-center`}>
        <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className={`text-lg font-semibold ${darkMode.text} mb-2`}>Select Topics to Visualize</h3>
        <p className={`${darkMode.textSecondary}`}>Choose one or more topics to see their learning curves.</p>
      </div>
    );
  }

  // Prepare combined data for multi-line chart
  const getCombinedData = () => {
    const maxLength = Math.max(...Object.values(learningData).map(d => d.data?.length || 0));
    const combined = [];
    
    for (let i = 0; i < maxLength; i++) {
      const point = { index: i + 1 };
      
      Object.entries(learningData).forEach(([topic, curveData]) => {
        if (curveData.data && curveData.data[i]) {
          point[topic] = viewMode === 'accuracy' 
            ? curveData.data[i].accuracy 
            : viewMode === 'speed'
            ? curveData.data[i].avgTime
            : curveData.data[i].accuracy; // For combined view
          
          if (viewMode === 'combined') {
            point[`${topic}_time`] = curveData.data[i].avgTime;
          }
        }
      });
      
      combined.push(point);
    }
    
    // Add predictions if enabled
    if (showPrediction) {
      Object.entries(learningData).forEach(([topic, curveData]) => {
        if (curveData.data) {
          const predictions = generatePrediction(curveData.data);
          predictions.forEach((pred, idx) => {
            if (!combined[maxLength + idx]) {
              combined[maxLength + idx] = { index: pred.index };
            }
            combined[maxLength + idx][topic] = pred.accuracy;
            combined[maxLength + idx].isPrediction = true;
          });
        }
      });
    }
    
    return combined;
  };

  const combinedData = getCombinedData();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className={`${darkMode.card} rounded-xl shadow-sm p-4`}>
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode.textSecondary}`}>View Mode:</span>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className={`px-3 py-1 border rounded-lg text-sm ${darkMode.inputBg} ${darkMode.inputBorder} ${darkMode.inputText}`}
              >
                <option value="accuracy">Accuracy Progress</option>
                <option value="speed">Speed Progress</option>
                <option value="combined">Combined View</option>
              </select>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPrediction}
                onChange={(e) => setShowPrediction(e.target.checked)}
                className="rounded text-purple-500"
              />
              <span className={`text-sm ${darkMode.text}`}>Show Predictions</span>
            </label>
          </div>
          
          <div className={`flex items-center gap-2 text-sm ${darkMode.textSecondary}`}>
            <Info className="w-4 h-4" />
            <span>Analyzing {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>
          Learning Progress {viewMode === 'accuracy' ? '(Accuracy)' : viewMode === 'speed' ? '(Speed)' : '(Combined)'}
        </h3>
        
        <ResponsiveContainer width="100%" height={400}>
          {viewMode === 'combined' ? (
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="index" 
                stroke={chartTheme.axis}
                label={{ value: 'Practice Sessions', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                yAxisId="left"
                stroke={chartTheme.axis}
                domain={[0, 100]}
                label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={chartTheme.axis}
                label={{ value: 'Time (seconds)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: chartTheme.tooltip.backgroundColor, 
                  border: `1px solid ${chartTheme.tooltip.borderColor}`,
                  color: chartTheme.tooltip.textColor 
                }} 
              />
              <Legend />
              
              {/* Reference lines */}
              <ReferenceLine 
                yAxisId="left" 
                y={80} 
                stroke="#10b981" 
                strokeDasharray="3 3" 
                label="Proficiency Target"
              />
              
              {/* Prediction area */}
              {showPrediction && (
                <ReferenceArea
                  x1={combinedData.findIndex(d => d.isPrediction)}
                  x2={combinedData.length - 1}
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                />
              )}
              
              {selectedTopics.map((topic, idx) => (
                <React.Fragment key={topic}>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={topic}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={`${topic} (Accuracy)`}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={`${topic}_time`}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name={`${topic} (Time)`}
                  />
                </React.Fragment>
              ))}
            </LineChart>
          ) : (
            <AreaChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis 
                dataKey="index" 
                stroke={chartTheme.axis}
                label={{ value: 'Practice Sessions', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                stroke={chartTheme.axis}
                domain={viewMode === 'accuracy' ? [0, 100] : 'auto'}
                label={{ 
                  value: viewMode === 'accuracy' ? 'Accuracy %' : 'Time (seconds)', 
                  angle: -90, 
                  position: 'insideLeft' 
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: chartTheme.tooltip.backgroundColor, 
                  border: `1px solid ${chartTheme.tooltip.borderColor}`,
                  color: chartTheme.tooltip.textColor 
                }} 
              />
              <Legend />
              
              {viewMode === 'accuracy' && (
                <ReferenceLine 
                  y={80} 
                  stroke="#10b981" 
                  strokeDasharray="3 3" 
                  label="Target"
                />
              )}
              
              {showPrediction && (
                <ReferenceArea
                  x1={combinedData.findIndex(d => d.isPrediction)}
                  x2={combinedData.length - 1}
                  fill="#8b5cf6"
                  fillOpacity={0.1}
                  label="Predicted"
                />
              )}
              
              {selectedTopics.map((topic, idx) => (
                <Area
                  key={topic}
                  type="monotone"
                  dataKey={topic}
                  stroke={colors[idx % colors.length]}
                  fill={colors[idx % colors.length]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(learningData).map(([topic, data]) => {
          if (!data.summary) return null;
          
          return (
            <div key={topic} className={`${darkMode.card} rounded-xl shadow-sm p-4`}>
              <h4 className={`font-semibold ${darkMode.text} mb-2`}>{topic}</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode.textSecondary}`}>Sessions</span>
                  <span className={`text-sm font-medium ${darkMode.text}`}>
                    {data.summary.totalSessions}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode.textSecondary}`}>Improvement</span>
                  <span className={`text-sm font-medium flex items-center gap-1 ${
                    data.summary.improvementRate > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {data.summary.improvementRate > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                    {data.summary.improvementRate > 0 ? '+' : ''}{Math.round(data.summary.improvementRate)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode.textSecondary}`}>Current</span>
                  <span className={`text-sm font-medium ${darkMode.text}`}>
                    {Math.round(data.summary.currentAccuracy)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode.textSecondary}`}>Speed Gain</span>
                  <span className={`text-sm font-medium ${
                    data.summary.timeEfficiency > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {data.summary.timeEfficiency > 0 ? '+' : ''}{Math.round(data.summary.timeEfficiency)}%
                  </span>
                </div>
              </div>
              
              {/* Mini sparkline */}
              <div className="mt-3 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.data.slice(-10)}>
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className={`${darkMode.card} rounded-xl shadow-sm p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode.text} mb-4 flex items-center gap-2`}>
          <Brain className="w-5 h-5 text-purple-500" />
          Learning Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <h4 className={`font-medium ${darkMode.text}`}>Learning Pattern</h4>
            </div>
            <p className={`text-sm ${darkMode.textSecondary}`}>
              Your learning curve shows {
                Object.values(learningData).filter(d => d.summary?.improvementRate > 10).length > 0
                  ? 'steady improvement'
                  : 'room for improvement'
              } across topics. Focus on consistent practice.
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <h4 className={`font-medium ${darkMode.text}`}>Speed Progress</h4>
            </div>
            <p className={`text-sm ${darkMode.textSecondary}`}>
              {Object.values(learningData).filter(d => d.summary?.timeEfficiency > 0).length > 0
                ? 'You\'re getting faster at solving problems! Keep up the momentum.'
                : 'Focus on understanding concepts first, speed will follow naturally.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearningCurveViz;