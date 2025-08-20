import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Worksheets from './pages/Worksheets';
import WorksheetSolver from './pages/WorksheetSolver';
import WorksheetView from './pages/WorksheetView';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import ComprehensiveAdminDashboard from './pages/ComprehensiveAdminDashboard';
import KidManagement from './pages/KidManagement';
import AccessDenied from './pages/AccessDenied';
import GoogleCallback from './pages/GoogleCallback';
import PaymentSuccess from './pages/PaymentSuccess';
import KidProfileSetup from './components/KidProfileSetup';
import api from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [activeKidProfile, setActiveKidProfile] = useState(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me');
      console.log('Full /me response:', response.data);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        
        // Check if user has setup kid profiles
        console.log('User data:', response.data.user);
        console.log('hasSetupKidProfiles:', response.data.user.hasSetupKidProfiles);
        
        if (!response.data.user.hasSetupKidProfiles) {
          console.log('Setting needsProfileSetup to true');
          setNeedsProfileSetup(true);
        } else {
          console.log('User has setup profiles, fetching active profile');
          // Fetch active kid profile
          await fetchActiveProfile();
        }
      } else {
        console.error('Invalid response structure from /me endpoint');
        logout();
      }
    } catch (error) {
      console.error('Auth error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProfile = async () => {
    try {
      const response = await api.get('/kid-profiles/active');
      if (response.data.success) {
        setActiveKidProfile(response.data.activeProfile);
      }
    } catch (error) {
      console.error('Failed to fetch active profile:', error);
    }
  };

  const login = async (username, twoFactorCode) => {
    try {
      const response = await api.post('/auth/login', { username, twoFactorCode });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Don't log in immediately after registration since 2FA needs to be set up
      return { 
        success: true,
        qrCode: response.data.qrCode,
        secret: response.data.secret,
        user: response.data.user
      };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const loginWithToken = async (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    // Fetch user info with the new token
    try {
      const response = await api.get('/auth/me');
      console.log('loginWithToken /me response:', response.data);
      
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        
        // Check if user needs profile setup
        if (!response.data.user.hasSetupKidProfiles) {
          console.log('loginWithToken: Setting needsProfileSetup to true');
          setNeedsProfileSetup(true);
        } else {
          await fetchActiveProfile();
        }
      } else {
        console.error('Invalid response structure from /me endpoint in loginWithToken');
        logout();
        return { success: false };
      }
      
      return { success: true };
    } catch (error) {
      logout();
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setActiveKidProfile(null);
    setNeedsProfileSetup(false);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateUser = async (updates) => {
    try {
      const response = await api.put('/auth/profile', updates);
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  };

  const handleProfileSetupComplete = async () => {
    setNeedsProfileSetup(false);
    await fetchUserInfo(); // Refresh user and active profile
  };

  const switchKidProfile = (newProfile) => {
    setActiveKidProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show kid profile setup if needed
  console.log('Rendering check - user:', !!user, 'needsProfileSetup:', needsProfileSetup);
  
  if (user && needsProfileSetup) {
    console.log('Showing KidProfileSetup component');
    return (
      <ThemeProvider>
        <AuthContext.Provider value={{ user, token, login, register, logout, loginWithToken, updateUser, activeKidProfile, switchKidProfile }}>
          <KidProfileSetup onComplete={handleProfileSetupComplete} />
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, token, login, register, logout, loginWithToken, updateUser, activeKidProfile, switchKidProfile }}>
        <Router>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/pricing" element={<Navigate to="/#pricing" />} />
            <Route path="/auth/google/success" element={<GoogleCallback />} />
            <Route path="/payment-success" element={user ? <PaymentSuccess /> : <Navigate to="/login" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/worksheets" element={user ? <Worksheets /> : <Navigate to="/login" />} />
            <Route path="/worksheet/:id" element={user ? <WorksheetSolver /> : <Navigate to="/login" />} />
            <Route path="/worksheet/:id/view" element={user ? <WorksheetView /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/login" />} />
            <Route path="/kids" element={user ? <KidManagement /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.accessLevel === 'admin' ? <ComprehensiveAdminDashboard /> : <Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}

export default App;
