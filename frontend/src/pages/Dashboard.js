import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/Layout';
import WorksheetGenerator from '../components/WorksheetGenerator';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import api from '../services/api';
import { 
  Plus, 
  FileText, 
  Target, 
  TrendingUp, 
  Award, 
  Brain,
  BarChart,
  Clock,
  Crown,
  AlertCircle
} from 'lucide-react';
import paymentService from '../services/payment';

function Dashboard() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
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
            <p className={`mt-4 ${darkMode.textSecondary}`}>Loading dashboard...</p>
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

        {/* Subscription Status */}
        {user?.subscription?.plan === 'free' && (
          <div className={`${darkMode.card} rounded-xl p-6 shadow-sm border-2 border-orange-300 dark:border-orange-600`}>
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-8 h-8 text-orange-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${darkMode.text} mb-2`}>
                  Upgrade to Premium
                </h3>
                <p className={`${darkMode.textSecondary} mb-4`}>
                  You're currently on the free plan. Upgrade to generate AI-powered worksheets for your kids!
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await paymentService.createCheckoutSession('monthly');
                      } catch (error) {
                        alert(error.message || 'Payment system is currently unavailable. Please try again later.');
                      }
                    }}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Monthly $9.99
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await paymentService.createCheckoutSession('annual');
                      } catch (error) {
                        alert(error.message || 'Payment system is currently unavailable. Please try again later.');
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Annual $99.99 (Save 17%)
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await paymentService.createCheckoutSession('lifetime');
                      } catch (error) {
                        alert(error.message || 'Payment system is currently unavailable. Please try again later.');
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Lifetime $299.99
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Status */}
        {user?.subscription?.plan !== 'free' && (
          <div className={`${darkMode.card} rounded-xl p-6 shadow-sm border-2 border-green-300 dark:border-green-600`}>
            <div className="flex items-start space-x-4">
              <Crown className="w-8 h-8 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${darkMode.text} mb-2`}>
                  {user?.subscription?.plan === 'lifetime' ? 'Lifetime' : user?.subscription?.plan?.charAt(0).toUpperCase() + user?.subscription?.plan?.slice(1)} Subscription Active
                </h3>
                <p className={`${darkMode.textSecondary}`}>
                  {user?.subscription?.plan === 'lifetime' 
                    ? 'You have unlimited access to all features!'
                    : `You have ${(user?.subscription?.aiRequestsLimit || 0) - (user?.subscription?.aiRequestsUsed || 0)} worksheet generations remaining this period.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className={`${darkMode.card} rounded-xl p-4 sm:p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm ${darkMode.textSecondary}`}>Total Worksheets</p>
                <p className={`text-xl sm:text-2xl font-bold ${darkMode.text}`}>
                  {stats?.userStats?.totalWorksheets || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className={`${darkMode.card} rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>Average Score</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>
                  {stats?.userStats?.averageScore || 0}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className={`${darkMode.card} rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>Current Streak</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>
                  {stats?.userStats?.streak?.current || 0} days
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className={`${darkMode.card} rounded-xl p-6 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>AI Requests</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>
                  {user?.subscription?.plan === 'lifetime' 
                    ? '∞' 
                    : `${user?.subscription?.aiRequestsUsed || 0}/${user?.subscription?.aiRequestsLimit || 0}`
                  }
                </p>
              </div>
              <Brain className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`${darkMode.card} rounded-xl p-6 shadow-sm`}>
          <h2 className={`text-lg font-semibold ${darkMode.text} mb-4`}>Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowGenerator(true)}
              className={`p-4 border-2 border-dashed ${isDarkMode ? 'border-purple-800 hover:border-purple-600 hover:bg-purple-900/20' : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50'} rounded-lg transition-all group`}
            >
              <Plus className="w-8 h-8 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className={`text-sm font-medium ${darkMode.text}`}>Generate New Worksheet</p>
            </button>

            <Link
              to="/worksheets"
              className={`p-4 border-2 border-dashed ${isDarkMode ? 'border-blue-800 hover:border-blue-600 hover:bg-blue-900/20' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'} rounded-lg transition-all group block text-center`}
            >
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className={`text-sm font-medium ${darkMode.text}`}>View All Worksheets</p>
            </Link>

            <Link
              to="/analytics"
              className={`p-4 border-2 border-dashed ${isDarkMode ? 'border-green-800 hover:border-green-600 hover:bg-green-900/20' : 'border-green-300 hover:border-green-500 hover:bg-green-50'} rounded-lg transition-all group block text-center`}
            >
              <BarChart className="w-8 h-8 text-green-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className={`text-sm font-medium ${darkMode.text}`}>View Analytics</p>
            </Link>
          </div>
        </div>

        {/* Recent Worksheets */}
        <div className={`${darkMode.card} rounded-xl p-6 shadow-sm`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-lg font-semibold ${darkMode.text}`}>Recent Worksheets</h2>
            <Link
              to="/worksheets"
              className={`text-sm ${isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} font-medium`}
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
                  className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      worksheet.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`} />
                    <div>
                      <p className={`font-medium ${darkMode.text}`}>{worksheet.title}</p>
                      <p className={`text-sm ${darkMode.textSecondary}`}>
                        Grade {worksheet.grade} • {worksheet.problemCount || worksheet.problems?.length || 0} problems
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {worksheet.score !== null && (
                      <span className={`text-sm font-medium ${darkMode.text}`}>{worksheet.score}%</span>
                    )}
                    <Clock className={`w-4 h-4 ${darkMode.textMuted}`} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={`${darkMode.textSecondary} text-center py-8`}>
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
