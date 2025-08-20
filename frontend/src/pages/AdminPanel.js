import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import api from '../services/api';
import {
  Users,
  Mail,
  Shield,
  BarChart,
  Plus,
  Search,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Filter
} from 'lucide-react';

function AdminPanel() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  
  const [activeTab, setActiveTab] = useState('analytics');
  const [allowedEmails, setAllowedEmails] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [accessLevelFilter, setAccessLevelFilter] = useState('');
  const [newEmails, setNewEmails] = useState('');
  const [newAccessLevel, setNewAccessLevel] = useState('basic');
  const [notes, setNotes] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (user?.accessLevel !== 'admin') {
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'emails') {
      fetchAllowedEmails();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/admin/analytics');
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
    setLoading(false);
  };

  const fetchAllowedEmails = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (accessLevelFilter) params.append('accessLevel', accessLevelFilter);
      
      const response = await api.get(`/auth/admin/emails?${params}`);
      setAllowedEmails(response.data.allowedEmails);
    } catch (error) {
      console.error('Error fetching allowed emails:', error);
    }
    setLoading(false);
  };

  const addEmails = async () => {
    if (!newEmails.trim()) return;

    try {
      const emails = newEmails.split('\n')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      const response = await api.post('/auth/admin/emails', {
        emails,
        accessLevel: newAccessLevel,
        notes
      });

      if (response.data.success) {
        setNewEmails('');
        setNotes('');
        fetchAllowedEmails();
        alert(`Added ${response.data.added.length} emails successfully!`);
      }
    } catch (error) {
      console.error('Error adding emails:', error);
      alert('Error adding emails. Please try again.');
    }
  };

  const removeEmail = async (emailId) => {
    if (!window.confirm('Are you sure you want to remove this email?')) return;

    try {
      await api.delete(`/auth/admin/emails/${emailId}`);
      fetchAllowedEmails();
    } catch (error) {
      console.error('Error removing email:', error);
      alert('Error removing email. Please try again.');
    }
  };

  const filteredEmails = allowedEmails.filter(email => {
    const matchesSearch = !searchTerm || 
      email.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !accessLevelFilter || 
      email.accessLevel === accessLevelFilter;
    return matchesSearch && matchesFilter;
  });

  const tabs = [
    { id: 'analytics', name: 'Analytics', icon: BarChart },
    { id: 'emails', name: 'Email Management', icon: Mail },
    { id: 'users', name: 'User Management', icon: Users }
  ];

  if (user?.accessLevel !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${darkMode.text}`}>Admin Panel</h1>
            <p className={`${darkMode.textSecondary} mt-2`}>
              Manage users, emails, and platform analytics
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-red-500" />
            <span className={`text-sm font-medium ${darkMode.text}`}>Admin Access</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : `${darkMode.textSecondary} hover:${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : analytics ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-blue-500" />
                      <div className="ml-4">
                        <p className={`text-2xl font-bold ${darkMode.text}`}>
                          {analytics.totalUsers}
                        </p>
                        <p className={`text-sm ${darkMode.textSecondary}`}>Total Users</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
                    <div className="flex items-center">
                      <Mail className="w-8 h-8 text-green-500" />
                      <div className="ml-4">
                        <p className={`text-2xl font-bold ${darkMode.text}`}>
                          {analytics.totalAllowedEmails}
                        </p>
                        <p className={`text-sm ${darkMode.textSecondary}`}>Allowed Emails</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
                    <div className="flex items-center">
                      <CheckCircle className="w-8 h-8 text-purple-500" />
                      <div className="ml-4">
                        <p className={`text-2xl font-bold ${darkMode.text}`}>
                          {analytics.activeEmails}
                        </p>
                        <p className={`text-sm ${darkMode.textSecondary}`}>Active Emails</p>
                      </div>
                    </div>
                  </div>

                  <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
                    <div className="flex items-center">
                      <BarChart className="w-8 h-8 text-orange-500" />
                      <div className="ml-4">
                        <p className={`text-2xl font-bold ${darkMode.text}`}>
                          {analytics.totalLogins}
                        </p>
                        <p className={`text-sm ${darkMode.textSecondary}`}>Total Logins</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Users */}
                <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
                  <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>Recent Users</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${darkMode.border}`}>
                          <th className={`text-left py-3 ${darkMode.text}`}>Name</th>
                          <th className={`text-left py-3 ${darkMode.text}`}>Email</th>
                          <th className={`text-left py-3 ${darkMode.text}`}>Joined</th>
                          <th className={`text-left py-3 ${darkMode.text}`}>Last Login</th>
                          <th className={`text-left py-3 ${darkMode.text}`}>Worksheets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentUsers.map(user => (
                          <tr key={user._id} className={`border-b ${darkMode.border}`}>
                            <td className={`py-3 ${darkMode.text}`}>{user.name}</td>
                            <td className={`py-3 ${darkMode.textSecondary}`}>{user.email}</td>
                            <td className={`py-3 ${darkMode.textSecondary}`}>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className={`py-3 ${darkMode.textSecondary}`}>
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                            </td>
                            <td className={`py-3 ${darkMode.text}`}>{user.stats?.totalWorksheets || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className={`w-12 h-12 ${darkMode.textMuted} mx-auto mb-4`} />
                <p className={`${darkMode.textSecondary}`}>Error loading analytics</p>
              </div>
            )}
          </div>
        )}

        {/* Email Management Tab */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            {/* Add Emails Section */}
            <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
              <h3 className={`text-lg font-semibold ${darkMode.text} mb-4`}>Add New Emails</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${darkMode.text} mb-2`}>
                    Email Addresses (one per line)
                  </label>
                  <textarea
                    value={newEmails}
                    onChange={(e) => setNewEmails(e.target.value)}
                    placeholder="john@example.com&#10;jane@example.com&#10;admin@company.com"
                    className={`w-full h-32 px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                  />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode.text} mb-2`}>
                      Access Level
                    </label>
                    <select
                      value={newAccessLevel}
                      onChange={(e) => setNewAccessLevel(e.target.value)}
                      className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    >
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${darkMode.text} mb-2`}>
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., School district teachers"
                      className={`w-full px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>

                  <button
                    onClick={addEmails}
                    disabled={!newEmails.trim()}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Emails
                  </button>
                </div>
              </div>
            </div>

            {/* Email List */}
            <div className={`${darkMode.card} p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${darkMode.text}`}>Allowed Emails</h3>
                <button
                  onClick={fetchAllowedEmails}
                  className={`px-3 py-2 rounded-lg transition-colors ${darkMode.buttonSecondary} border`}
                >
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode.textMuted}`} />
                    <input
                      type="text"
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                  </div>
                </div>
                <div>
                  <select
                    value={accessLevelFilter}
                    onChange={(e) => setAccessLevelFilter(e.target.value)}
                    className={`px-3 py-2 border ${darkMode.inputBorder} ${darkMode.inputBg} ${darkMode.inputText} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  >
                    <option value="">All Access Levels</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Email Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${darkMode.border}`}>
                      <th className={`text-left py-3 ${darkMode.text}`}>Email</th>
                      <th className={`text-left py-3 ${darkMode.text}`}>Access Level</th>
                      <th className={`text-left py-3 ${darkMode.text}`}>Login Count</th>
                      <th className={`text-left py-3 ${darkMode.text}`}>Last Login</th>
                      <th className={`text-left py-3 ${darkMode.text}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmails.map(email => (
                      <tr key={email._id} className={`border-b ${darkMode.border} hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <td className={`py-3 ${darkMode.text}`}>{email.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            email.accessLevel === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            email.accessLevel === 'premium' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {email.accessLevel}
                          </span>
                        </td>
                        <td className={`py-3 ${darkMode.textSecondary}`}>{email.loginCount}</td>
                        <td className={`py-3 ${darkMode.textSecondary}`}>
                          {email.lastLoginAt ? new Date(email.lastLoginAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => removeEmail(email._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredEmails.length === 0 && (
                  <div className="text-center py-8">
                    <Mail className={`w-12 h-12 ${darkMode.textMuted} mx-auto mb-4`} />
                    <p className={`${darkMode.textSecondary}`}>No emails found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className={`${darkMode.card} p-8 rounded-xl shadow-sm text-center`}>
            <Users className={`w-16 h-16 ${darkMode.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${darkMode.text} mb-2`}>User Management</h3>
            <p className={`${darkMode.textSecondary} mb-4`}>
              Advanced user management features coming soon
            </p>
            <p className={`text-sm ${darkMode.textMuted}`}>
              For now, manage user access through the Email Management tab
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminPanel;