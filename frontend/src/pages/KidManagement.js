import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';
import Layout from '../components/Layout';
import { Edit2, Trash2, Plus, BarChart, Trophy, Calendar, Clock } from 'lucide-react';

const KidManagement = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const avatarOptions = [
    '👦', '👧', '🧒', '👶', '🧑', '👱', '👨', '👩',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'
  ];

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await api.get('/kid-profiles');
      if (response.data.success) {
        setProfiles(response.data.profiles);
      }
    } catch (error) {
      toast.error('Failed to fetch profiles');
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProfile = async (profileData) => {
    try {
      const response = await api.post('/kid-profiles', profileData);
      if (response.data.success) {
        toast.success('Kid profile created successfully!');
        setProfiles([...profiles, response.data.profile]);
        setShowAddForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async (profileId, updates) => {
    try {
      const response = await api.put(`/kid-profiles/${profileId}`, updates);
      if (response.data.success) {
        toast.success('Profile updated successfully!');
        setProfiles(profiles.map(p => 
          p._id === profileId ? response.data.profile : p
        ));
        setEditingProfile(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      try {
        const response = await api.delete(`/kid-profiles/${profileId}`);
        if (response.data.success) {
          toast.success('Profile deleted successfully');
          setProfiles(profiles.filter(p => p._id !== profileId));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete profile');
      }
    }
  };

  const ProfileCard = ({ profile }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{profile.avatar || '👤'}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {profile.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Grade {profile.grade === 'K' ? 'K' : profile.grade}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingProfile(profile)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteProfile(profile._id)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <BarChart className="w-4 h-4 text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {profile.stats.totalWorksheets} worksheets
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {profile.stats.averageScore}% avg score
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {profile.stats.streak.current} day streak
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-purple-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {Math.round(profile.stats.timeSpent / 60)} hours
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Created {new Date(profile.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  const ProfileForm = ({ profile, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: profile?.name || '',
      grade: profile?.grade || '1',
      avatar: profile?.avatar || ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        toast.error('Please enter a name');
        return;
      }
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {profile ? 'Edit Kid Profile' : 'Add New Kid Profile'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grade *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {grades.map(grade => (
                  <option key={grade} value={grade}>
                    {grade === 'K' ? 'Kindergarten' : `Grade ${grade}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-8 gap-2">
                {avatarOptions.map((avatar, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar })}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center
                      ${formData.avatar === avatar 
                        ? 'bg-blue-500 ring-2 ring-blue-300' 
                        : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {profile ? 'Update' : 'Create'} Profile
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kid Profiles
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage profiles for up to 4 kids and track their learning progress
            </p>
          </div>
          
          {profiles.length < 4 && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Kid</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No kid profiles yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create profiles for your kids to track their learning progress individually.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <ProfileCard key={profile._id} profile={profile} />
            ))}
          </div>
        )}

        {profiles.length >= 4 && (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Maximum of 4 kid profiles reached
          </div>
        )}

        {showAddForm && (
          <ProfileForm
            onSubmit={handleAddProfile}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {editingProfile && (
          <ProfileForm
            profile={editingProfile}
            onSubmit={(data) => handleUpdateProfile(editingProfile._id, data)}
            onCancel={() => setEditingProfile(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default KidManagement;