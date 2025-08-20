import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import WorksheetGenerator from '../components/WorksheetGenerator';
import api from '../services/api';
import { 
  Plus, 
  FileText, 
  Target, 
  TrendingUp, 
  Award, 
  Brain,
  BarChart,
  Clock
} from 'lucide-react';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showGenerator, setShowGenerator] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentWorksheets, setRecentWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, worksheetsRes] = await Promise.all([
        api.get('/analytics/user'),
        api.get('/worksheets?limit=5')
      ]);
      
      setStats(analyticsRes.data.analytics);
      setRecentWorksheets(worksheetsRes.data.worksheets);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorksheetGenerated = (worksheet) => {
    // MongoDB uses _id, not id
    const worksheetId = worksheet._id || worksheet.id;
    console.log('Navigating to worksheet:', worksheetId);
    if (worksheetId) {
      navigate(`/worksheet/${worksheetId}`);
    } else {
      console.error('No worksheet ID found:', worksheet);
      // Refresh the worksheets list instead
      fetchDashboardData();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-purple-100">
            Ready to create some educational worksheets today? You're on a {stats?.userStats?.streak?.current || 0} day streak!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Worksheets</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.userStats?.totalWorksheets || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.userStats?.averageScore || 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.userStats?.streak?.current || 0} days
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">AI Requests</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats?.subscription?.aiRequestsUsed || 0}/{stats?.subscription?.aiRequestsLimit || 50}
                </p>
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowGenerator(true)}
              className="p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <Plus className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">Generate New Worksheet</p>
            </button>

            <Link
              to="/worksheets"
              className="p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group block text-center"
            >
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">View All Worksheets</p>
            </Link>

            <Link
              to="/analytics"
              className="p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group block text-center"
            >
              <BarChart className="w-8 h-8 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-medium text-gray-700">View Analytics</p>
            </Link>
          </div>
        </div>

        {/* Recent Worksheets */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recent Worksheets</h2>
            <Link
              to="/worksheets"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {recentWorksheets.length > 0 ? (
            <div className="space-y-3">
              {recentWorksheets.map(worksheet => (
                <Link
                  key={worksheet._id}
                  to={`/worksheet/${worksheet._id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      worksheet.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-800">{worksheet.title}</p>
                      <p className="text-sm text-gray-500">
                        Grade {worksheet.grade} • {worksheet.problemCount || worksheet.problems?.length || 0} problems
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {worksheet.score !== null && (
                      <span className="text-sm font-medium text-gray-700">{worksheet.score}%</span>
                    )}
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No worksheets yet. Create your first one!
            </p>
          )}
        </div>
      </div>

      {/* Worksheet Generator Modal */}
      {showGenerator && (
        <WorksheetGenerator
          onClose={() => setShowGenerator(false)}
          onGenerate={handleWorksheetGenerated}
          userGrade={user?.grade}
        />
      )}
    </Layout>
  );
}

export default Dashboard;
