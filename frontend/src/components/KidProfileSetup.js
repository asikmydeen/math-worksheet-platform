import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../utils/api';

const KidProfileSetup = ({ onComplete }) => {
  const [profiles, setProfiles] = useState([{ name: '', grade: '1', avatar: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  
  const avatarOptions = [
    '👦', '👧', '🧒', '👶', '🧑', '👱', '👨', '👩',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'
  ];

  const addProfile = () => {
    if (profiles.length < 4) {
      setProfiles([...profiles, { name: '', grade: '1', avatar: '' }]);
    }
  };

  const removeProfile = (index) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((_, i) => i !== index));
    }
  };

  const updateProfile = (index, field, value) => {
    const updatedProfiles = profiles.map((profile, i) =>
      i === index ? { ...profile, [field]: value } : profile
    );
    setProfiles(updatedProfiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validProfiles = profiles.filter(p => p.name.trim());
    if (validProfiles.length === 0) {
      toast.error('Please add at least one kid profile');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await api.post('/kid-profiles/bulk', {
        profiles: validProfiles
      });

      if (response.data.success) {
        toast.success(`Created ${response.data.createdProfiles.length} profiles!`);
        onComplete();
      } else {
        toast.error('Failed to create profiles');
      }
    } catch (error) {
      console.error('Profile creation error:', error);
      toast.error(error.response?.data?.message || 'Failed to create profiles');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Set Up Kid Profiles
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Create profiles for your kids to track their learning progress individually. 
            You can add up to 4 kids.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {profiles.map((profile, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Kid {index + 1}
                </h3>
                {profiles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProfile(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => updateProfile(index, 'name', e.target.value)}
                    placeholder="Enter kid's name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grade *
                  </label>
                  <select
                    value={profile.grade}
                    onChange={(e) => updateProfile(index, 'grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <div className="grid grid-cols-4 gap-2">
                    {avatarOptions.map((avatar, avatarIndex) => (
                      <button
                        key={avatarIndex}
                        type="button"
                        onClick={() => updateProfile(index, 'avatar', avatar)}
                        className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center
                          ${profile.avatar === avatar 
                            ? 'bg-blue-500 ring-2 ring-blue-300' 
                            : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
                          }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                  {profile.avatar && (
                    <div className="mt-2 text-center">
                      <span className="text-2xl">{profile.avatar}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={addProfile}
              disabled={profiles.length >= 4}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium 
                       disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + Add Another Kid {profiles.length >= 4 && '(Max 4)'}
            </button>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                         hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Profiles'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KidProfileSetup;