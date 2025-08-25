import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import WorksheetGenerator from '../components/WorksheetGenerator';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { useDarkModeClasses } from '../components/DarkModeWrapper';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle,
  XCircle,
  Play,
  Trash2,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Award,
  BookOpen,
  Printer
} from 'lucide-react';

function Worksheets() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const darkMode = useDarkModeClasses();
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const observerRef = useRef();
  const loadingRef = useRef();

  useEffect(() => {
    // Reset when filters change
    if (!initialLoad) {
      setWorksheets([]);
      setPage(1);
      setHasMore(true);
    }
    fetchWorksheets();
  }, [filterGrade, filterStatus, sortBy]);

  useEffect(() => {
    if (page > 1) {
      fetchWorksheets(true);
    }
  }, [page]);

  // Set up intersection observer for infinite scroll
  const lastWorksheetElementRef = useCallback(node => {
    if (loading) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore]);

  const fetchWorksheets = async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: append ? page : 1,
        limit: 10,
        sortBy,
        order: 'desc'
      });
      
      if (filterGrade !== 'all') params.append('grade', filterGrade);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await api.get(`/worksheets?${params}`);
      
      if (append) {
        setWorksheets(prev => [...prev, ...response.data.worksheets]);
      } else {
        setWorksheets(response.data.worksheets);
      }
      
      setTotalPages(response.data.pagination.pages);
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
      setInitialLoad(false);
    } catch (error) {
      console.error('Error fetching worksheets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (worksheetId) => {
    if (window.confirm('Are you sure you want to delete this worksheet?')) {
      try {
        await api.delete(`/worksheets/${worksheetId}`);
        fetchWorksheets();
      } catch (error) {
        console.error('Error deleting worksheet:', error);
        alert('Failed to delete worksheet');
      }
    }
  };

  const handleWorksheetGenerated = (worksheet) => {
    const worksheetId = worksheet._id || worksheet.id;
    if (worksheetId) {
      navigate(`/worksheet/${worksheetId}`);
    }
  };

  const filteredWorksheets = worksheets.filter(worksheet => 
    worksheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worksheet.topics?.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'completed': isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800',
      'in-progress': isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800',
      'draft': isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status] || styles.draft}`}>
        {status.replace('-', ' ')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading && worksheets.length === 0 && initialLoad) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className={`mt-4 ${darkMode.textSecondary}`}>Loading worksheets...</p>
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
            <h1 className={`text-2xl font-bold ${darkMode.text}`}>My Worksheets</h1>
            <p className={`mt-1 ${darkMode.textSecondary}`}>Manage and review all your math worksheets</p>
          </div>
          <button
            onClick={() => setShowGenerator(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Worksheet
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${darkMode.card} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>Total</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>{worksheets.length}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className={`${darkMode.card} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>Completed</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>
                  {worksheets.filter(w => w.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className={`${darkMode.card} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>In Progress</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>
                  {worksheets.filter(w => w.status === 'in-progress').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className={`${darkMode.card} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${darkMode.textSecondary}`}>Avg Score</p>
                <p className={`text-2xl font-bold ${darkMode.text}`}>
                  {worksheets.filter(w => w.score !== null).length > 0
                    ? Math.round(
                        worksheets
                          .filter(w => w.score !== null)
                          .reduce((acc, w) => acc + w.score, 0) / 
                        worksheets.filter(w => w.score !== null).length
                      )
                    : 0}%
                </p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`${darkMode.card} rounded-xl shadow-sm p-4`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search worksheets..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
            
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Grades</option>
              <option value="K">Kindergarten</option>
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>Grade {i+1}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="draft">Draft</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}
            >
              <option value="createdAt">Newest First</option>
              <option value="score">Highest Score</option>
              <option value="completedAt">Recently Completed</option>
            </select>
          </div>
        </div>

        {/* Worksheets List */}
        <div className={`${darkMode.card} rounded-xl shadow-sm overflow-hidden`}>
          {filteredWorksheets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className={`${darkMode.textSecondary} text-lg mb-2`}>No worksheets found</p>
              <p className={`${darkMode.textMuted} mb-6`}>Create your first worksheet to get started!</p>
              <button
                onClick={() => setShowGenerator(true)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Create Worksheet
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Title
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Subject
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Grade
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Topics
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Problems
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Score
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode.textMuted}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredWorksheets.map((worksheet, index) => (
                    <tr 
                      key={worksheet._id} 
                      ref={index === filteredWorksheets.length - 1 ? lastWorksheetElementRef : null}
                      className={`${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusIcon(worksheet.status)}
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          to={`/worksheet/${worksheet._id}`}
                          className="text-purple-600 hover:text-purple-700 font-medium"
                        >
                          {worksheet.title}
                        </Link>
                        {worksheet.description && (
                          <p className={`text-sm ${darkMode.textSecondary} mt-1`}>{worksheet.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          {worksheet.subject || 'Math'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${darkMode.text}`}>Grade {worksheet.grade}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {worksheet.topics?.slice(0, 3).map((topic, idx) => (
                            <span key={idx} className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                              {topic}
                            </span>
                          ))}
                          {worksheet.topics?.length > 3 && (
                            <span className={`px-2 py-1 text-xs rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              +{worksheet.topics.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${darkMode.text}`}>
                          {worksheet.problems?.length || worksheet.problemCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {worksheet.score !== null ? (
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${
                              worksheet.score >= 80 ? 'text-green-600' : 
                              worksheet.score >= 60 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {worksheet.score}%
                            </span>
                          </div>
                        ) : (
                          <span className={`text-sm ${darkMode.textMuted}`}>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${darkMode.textSecondary}`}>
                          {formatDate(worksheet.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {worksheet.status !== 'completed' ? (
                            <Link
                              to={`/worksheet/${worksheet._id}`}
                              className="text-purple-600 hover:text-purple-700"
                              title="Solve Quiz"
                            >
                              <Play className="w-4 h-4" />
                            </Link>
                          ) : (
                            <Link
                              to={`/worksheet/${worksheet._id}`}
                              className="text-blue-600 hover:text-blue-700"
                              title="Review"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            to={`/worksheet/${worksheet._id}/view`}
                            className="text-green-600 hover:text-green-700"
                            title="Printable View"
                          >
                            <Printer className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(worksheet._id)}
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {loading && !initialLoad && (
                    <tr>
                      <td colSpan="9" className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className={`ml-2 ${darkMode.textSecondary}`}>Loading more worksheets...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Load More Button (as fallback for users who prefer manual loading) */}
        {!loading && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setPage(prev => prev + 1)}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
            >
              Load More Worksheets
            </button>
          </div>
        )}
        
        {!hasMore && worksheets.length > 0 && (
          <div className="text-center mt-6">
            <p className={`${darkMode.textSecondary}`}>You've reached the end of your worksheets</p>
          </div>
        )}
      </div>

      {/* Worksheet Generator Modal */}
      {showGenerator && (
        <WorksheetGenerator
          onClose={() => setShowGenerator(false)}
          onGenerate={handleWorksheetGenerated}
        />
      )}
    </Layout>
  );
}

export default Worksheets;
