import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';

const ProfileSwitcher = ({ currentProfile, onProfileSwitch }) => {
  const [profiles, setProfiles] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleProfileSwitch = async (profileId) => {
    setIsLoading(true);
    try {
      const response = await api.put(`/kid-profiles/switch/${profileId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        onProfileSwitch(response.data.activeProfile);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Profile switch error:', error);
      toast.error('Failed to switch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const addNewProfile = () => {
    setIsOpen(false);
    // Navigate to kid management page
    window.location.href = '/kids';
  };

  // Always show the component, even if no profiles exist
  const hasProfiles = profiles.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-700 
                   border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-xl">
          {hasProfiles ? (currentProfile?.avatar || '👤') : '👶'}
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {hasProfiles ? (currentProfile?.name || 'Select Kid') : 'Add Kids'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-lg 
                       border border-gray-200 dark:border-gray-600 z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
              {hasProfiles ? 'SWITCH KID PROFILE' : 'KID PROFILES'}
            </div>
            
            {hasProfiles ? profiles.map((profile) => (
              <button
                key={profile._id}
                onClick={() => handleProfileSwitch(profile._id)}
                disabled={isLoading || currentProfile?._id === profile._id}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left
                           hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
                           ${currentProfile?._id === profile._id 
                             ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' 
                             : ''
                           }
                           disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-xl">{profile.avatar || '👤'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {profile.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Grade {profile.grade === 'K' ? 'K' : profile.grade}
                  </div>
                </div>
                {currentProfile?._id === profile._id && (
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </button>
            )) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  No kid profiles yet.<br />
                  Add kids to get started!
                </p>
              </div>
            )}

            {(!hasProfiles || profiles.length < 4) && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 my-2"></div>
                <button
                  onClick={addNewProfile}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left
                           hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors
                           text-blue-600 dark:text-blue-400"
                >
                  <span className="text-xl">➕</span>
                  <span className="font-medium">{hasProfiles ? 'Add Another Kid' : 'Add Your First Kid'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfileSwitcher;