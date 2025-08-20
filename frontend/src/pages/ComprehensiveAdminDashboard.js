import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import {
  Users, 
  Mail, 
  BarChart3, 
  Settings, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Crown,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ComprehensiveAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'emails', label: 'Email Access', icon: Mail },
    { id: 'settings', label: 'Platform Settings', icon: Settings }
  ];

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab, searchTerm, sortBy, sortOrder, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/admin/users', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          sortBy,
          order: sortOrder
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/admin/detailed-analytics');
      
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserAccess = async (userId, isActive) => {
    try {
      const response = await api.put(`/auth/admin/users/${userId}/access`, {
        isActive: !isActive
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user access');
    }
  };

  const handleUpdateSubscription = async (userId, plan) => {
    try {
      const response = await api.put(`/auth/admin/users/${userId}/subscription`, {
        plan
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchUsers(); // Refresh the list
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update subscription');
    }
  };

  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const getSubscriptionBadgeColor = (plan) => {
    switch (plan) {
      case 'lifetime': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'annual': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'monthly': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const UsersTab = () => (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="lastLogin-desc">Recent Activity</option>
          </select>
          
          <button
            onClick={fetchUsers}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Kids
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  AI Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <React.Fragment key={user._id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Joined {formatDate(user.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.subscription.plan}
                          onChange={(e) => handleUpdateSubscription(user._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getSubscriptionBadgeColor(user.subscription.plan)}`}
                        >
                          <option value="free">Free</option>
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                          <option value="lifetime">Lifetime</option>
                        </select>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {user.subscription.aiRequestsLimit === -1 ? 'Unlimited' : 
                           `${user.subscription.aiRequestsUsed}/${user.subscription.aiRequestsLimit} AI requests`}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.kidProfiles.length}
                          </span>
                          {user.kidProfiles.length > 0 && (
                            <button
                              onClick={() => toggleUserExpansion(user._id)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {expandedUsers.has(user._id) ? 
                                <ChevronUp className="w-4 h-4" /> : 
                                <ChevronDown className="w-4 h-4" />
                              }
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.totalKidWorksheets} worksheets total
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.subscription.aiRequestsUsed} total
                        </div>
                        {user.kidUsageBreakdown.length > 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            {user.kidUsageBreakdown.slice(0, 2).map((kid) => (
                              <div key={kid.kidId} className="flex items-center gap-1">
                                <span>{kid.avatar}</span>
                                <span>{kid.name}: {kid.worksheets}</span>
                              </div>
                            ))}
                            {user.kidUsageBreakdown.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{user.kidUsageBreakdown.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {user.lastLogin && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Last login: {formatDate(user.lastLogin)}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleUserAccess(user._id, user.isActive)}
                          className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${
                            user.isActive
                              ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {user.isActive ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Kid Details */}
                    {expandedUsers.has(user._id) && user.kidProfiles.length > 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">Kid Profiles:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {user.kidProfiles.map((kid) => (
                                <div key={kid._id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{kid.avatar}</span>
                                    <div>
                                      <div className="font-medium text-sm">{kid.name}</div>
                                      <div className="text-xs text-gray-500">Grade {kid.grade}</div>
                                    </div>
                                  </div>
                                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    <div>Worksheets: {kid.stats.totalWorksheets}</div>
                                    <div>Avg Score: {kid.stats.averageScore}%</div>
                                    <div>Streak: {kid.stats.streak.current} days</div>
                                    <div>Time: {Math.round(kid.stats.timeSpent / 60)}h</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                           rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
                           rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : analytics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.users.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {analytics.users.active} active, {analytics.users.inactive} inactive
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Kid Profiles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.kidProfiles.total}</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Avg {analytics.kidProfiles.avgPerUser.toFixed(1)} per user
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Worksheets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.worksheets.total}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {analytics.worksheets.completionRate}% completion rate
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.worksheets.completed}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Subscription Breakdown */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {analytics.subscriptions.map((sub) => (
                <div key={sub._id} className="text-center">
                  <div className={`text-2xl font-bold ${getSubscriptionBadgeColor(sub._id).replace('bg-', 'text-').replace('-100', '-600').replace('-900', '-400')}`}>
                    {sub.count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{sub._id}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">{sub.totalAiUsed} AI requests</div>
                </div>
              ))}
            </div>
          </div>

          {/* Worksheets by Grade */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Worksheets by Grade</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {analytics.worksheets.byGrade.map((grade) => (
                <div key={grade._id} className="text-center">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{grade.count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Grade {grade._id}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
              <div className="space-y-3">
                {analytics.recentActivity.users.slice(0, 8).map((user) => (
                  <div key={user._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Worksheets</h3>
              <div className="space-y-3">
                {analytics.recentActivity.worksheets.slice(0, 8).map((worksheet) => (
                  <div key={worksheet._id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div>
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{worksheet.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Grade {worksheet.grade} • {worksheet.subject}
                        {worksheet.kidProfile && (
                          <> • {worksheet.kidProfile.name}</>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(worksheet.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Failed to load analytics
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive platform management and analytics
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh All
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'emails' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Email management feature coming soon...
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Platform settings feature coming soon...
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ComprehensiveAdminDashboard;