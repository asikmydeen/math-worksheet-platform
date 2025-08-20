import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Award, Clock, BookOpen,
  Calendar, Activity, Star, Zap, Brain, Trophy,
  CheckCircle, XCircle, AlertCircle, BarChart2
} from 'lucide-react';

function Analytics() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [showDemo, setShowDemo] = useState(false);
  const [hasData, setHasData] = useState(true);

  // Helper function to format time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  useEffect(() => {
    if (showDemo) {
      setAnalytics(getMockAnalytics());
      setLoading(false);
    } else {
      fetchAnalytics();
    }
  }, [timeRange, selectedGrade, showDemo]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ timeRange });
      if (selectedGrade !== 'all') params.append('grade', selectedGrade);
      
      const response = await api.get(`/analytics/user?${params}`);
      if (response.data && response.data.analytics) {
        // Transform the API response to match the expected structure
        const data = response.data.analytics;
        const transformed = {
          overview: {
            totalWorksheets: data.userStats?.totalWorksheets || 0,
            completedWorksheets: data.userStats?.completedWorksheets || 0,
            averageScore: Math.round(data.userStats?.averageScore || 0),
            totalTimeSpent: data.userStats?.totalTimeSpent || 0,
            totalProblems: data.userStats?.totalProblems || 0,
            currentStreak: data.userStats?.streak?.current || 0,
            streak: data.userStats?.streak?.current || 0,
            improvement: 0 // Calculate if needed
          },
          performanceByGrade: data.performanceByGrade || [],
          performanceByTopic: data.performanceByTopic || [],
          recentActivity: (data.recentActivity || []).slice(0, 5).map(activity => ({
            ...activity,
            timeAgo: getTimeAgo(activity.completedAt || activity.createdAt)
          })),
          // Transform performanceByTopic to topicPerformance format
          topicPerformance: (data.performanceByTopic || []).map(item => ({
            topic: item._id || item.topic || 'Unknown',
            score: Math.round(item.averageScore || 0),
            count: item.count || 0
          })),
          performanceByDay: [], // Empty for now
          difficultyDistribution: [
            { name: 'Easy', value: 0 },
            { name: 'Medium', value: 0 },
            { name: 'Hard', value: 0 }
          ],
          skillsRadar: [],
          achievements: [],
          progressData: [] // Add empty array for now
        };
        setAnalytics(transformed);
        setHasData(true);
      } else {
        setAnalytics(null);
        setHasData(false);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  const getMockAnalytics = () => ({
    overview: {
      totalWorksheets: 47,
      completedWorksheets: 38,
      averageScore: 82,
      totalTimeSpent: 7200,
      streak: 5,
      improvement: 15
    },
    performanceByDay: [
      { day: 'Mon', score: 75, worksheets: 3 },
      { day: 'Tue', score: 80, worksheets: 2 },
      { day: 'Wed', score: 85, worksheets: 4 },
      { day: 'Thu', score: 78, worksheets: 2 },
      { day: 'Fri', score: 90, worksheets: 3 },
      { day: 'Sat', score: 88, worksheets: 1 },
      { day: 'Sun', score: 82, worksheets: 2 }
    ],
    topicPerformance: [
      { topic: 'Addition', score: 92, count: 15 },
      { topic: 'Subtraction', score: 88, count: 12 },
      { topic: 'Multiplication', score: 75, count: 10 },
      { topic: 'Division', score: 70, count: 8 },
      { topic: 'Fractions', score: 65, count: 5 },
      { topic: 'Geometry', score: 85, count: 7 }
    ],
    difficultyDistribution: [
      { name: 'Easy', value: 40, color: '#10b981' },
      { name: 'Medium', value: 35, color: '#f59e0b' },
      { name: 'Hard', value: 25, color: '#ef4444' }
    ],
    recentActivity: [
      { date: '2024-01-19', worksheets: 3, avgScore: 85 },
      { date: '2024-01-18', worksheets: 2, avgScore: 78 },
      { date: '2024-01-17', worksheets: 4, avgScore: 90 },
      { date: '2024-01-16', worksheets: 1, avgScore: 75 },
      { date: '2024-01-15', worksheets: 3, avgScore: 82 }
    ],
    skillsRadar: [
      { skill: 'Problem Solving', score: 85 },
      { skill: 'Speed', score: 70 },
      { skill: 'Accuracy', score: 90 },
      { skill: 'Consistency', score: 75 },
      { skill: 'Difficulty Handling', score: 65 },
      { skill: 'Topic Variety', score: 80 }
    ],
    achievements: [
      { id: 1, name: 'Perfect Score', description: 'Score 100% on a worksheet', icon: Trophy, unlocked: true },
      { id: 2, name: 'Week Warrior', description: 'Complete worksheets 7 days in a row', icon: Star, unlocked: true },
      { id: 3, name: 'Speed Demon', description: 'Complete 10 problems in under 5 minutes', icon: Zap, unlocked: false },
      { id: 4, name: 'Master Mind', description: 'Complete 50 worksheets', icon: Brain, unlocked: false }
    ]
  });

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (!hasData && !showDemo && !loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your progress and performance</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Analytics Data Yet</h2>
            <p className="text-gray-600 mb-6">
              Complete some worksheets to start seeing your performance analytics here.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowDemo(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                View Demo Analytics
              </button>
              <p className="text-sm text-gray-500">
                See what your analytics dashboard will look like with sample data
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your progress and performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                showDemo 
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-500' 
                  : 'bg-gray-100 text-gray-700 border-2 border-gray-300'
              }`}
            >
              {showDemo ? 'Demo Mode' : 'Live Data'}
            </button>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Grades</option>
              <option value="K">Kindergarten</option>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Grade {i+1}</option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {showDemo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Demo Mode:</strong> You're viewing sample analytics data. Click "Live Data" to see your actual performance.
            </p>
          </div>
        )}

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-purple-500" />
              <span className="text-xs text-green-600 font-medium flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                12%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{analytics.overview.totalWorksheets}</p>
            <p className="text-sm text-gray-600">Total Worksheets</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-xs text-green-600 font-medium">
                {Math.round((analytics.overview.completedWorksheets / analytics.overview.totalWorksheets) * 100)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{analytics.overview.completedWorksheets}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-blue-500" />
              <span className={`text-xs font-medium flex items-center ${
                analytics.overview.improvement > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.overview.improvement > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(analytics.overview.improvement)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{analytics.overview.averageScore}%</p>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{formatTime(analytics.overview.totalTimeSpent)}</p>
            <p className="text-sm text-gray-600">Time Spent</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{analytics.overview.streak}</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {Math.round(analytics.overview.totalTimeSpent / analytics.overview.completedWorksheets / 60)}
            </p>
            <p className="text-sm text-gray-600">Avg. Min/Sheet</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.performanceByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                <Line type="monotone" dataKey="worksheets" stroke="#ec4899" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Topic Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Topic Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topicPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="topic" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6">
                  {analytics.topicPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Difficulty Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Difficulty Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.difficultyDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value}) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.difficultyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Skills Radar */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Skills Analysis</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={analytics.skillsRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-600">{activity.worksheets} worksheets</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      activity.avgScore >= 80 ? 'text-green-600' : 
                      activity.avgScore >= 60 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {activity.avgScore}%
                    </p>
                    <p className="text-xs text-gray-600">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    achievement.unlocked
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-8 h-8 ${
                      achievement.unlocked ? 'text-purple-500' : 'text-gray-400'
                    }`} />
                    {achievement.unlocked && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <h4 className={`font-semibold mb-1 ${
                    achievement.unlocked ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-sm p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="w-6 h-6 mr-2" />
            AI Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Strong Performance</p>
              <p className="text-xs opacity-90">You excel at Addition and Subtraction. Keep it up!</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Focus Area</p>
              <p className="text-xs opacity-90">Division needs more practice. Try easier problems first.</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <p className="text-sm font-medium mb-1">Study Pattern</p>
              <p className="text-xs opacity-90">You perform best in the morning. Schedule practice accordingly.</p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Analytics;