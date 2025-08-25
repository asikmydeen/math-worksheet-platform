import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProfileSwitcher from './ProfileSwitcher';
import {
  Calculator,
  Home,
  FileText,
  BarChart,
  LogOut,
  User,
  Users,
  Baby,
  Moon,
  Sun,
  Edit2
} from 'lucide-react';

function Layout({ children }) {
  const { user, logout, updateUser, activeKidProfile, switchKidProfile } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Worksheets', href: '/worksheets', icon: FileText },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    { name: 'Kids', href: '/kids', icon: Baby },
    ...(user?.accessLevel === 'admin' ? [{ name: 'Admin', href: '/admin', icon: Users }] : [])
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <h1 className={`ml-3 text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>BrainyBees</h1>
              </Link>

              <nav className="ml-10 flex space-x-4">
                {navigation.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                        isActive
                          ? isDarkMode 
                            ? 'bg-purple-900 text-purple-300'
                            : 'bg-purple-100 text-purple-700'
                          : isDarkMode
                            ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Profile Switcher */}
              <ProfileSwitcher 
                currentProfile={activeKidProfile}
                onProfileSwitch={switchKidProfile}
              />

              {/* User info */}
              <div className="flex items-center space-x-2 text-sm">
                <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;
