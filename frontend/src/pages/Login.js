import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Shield, Smartphone, Key, AlertCircle, CheckCircle } from 'lucide-react';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    twoFactorCode: '',
    grade: '3',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const result = await login(formData.username, formData.twoFactorCode);
        if (!result.success) {
          setError(result.message || 'Invalid username or authentication code');
        }
      } else {
        const result = await register(formData);
        if (result.success) {
          setShowQRCode(true);
          setQrCodeData(result.qrCode);
          setSetupSecret(result.secret);
          setSuccess('Account created! Please set up 2FA using the QR code below.');
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          twoFactorCode: formData.twoFactorCode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('2FA verified! You can now login.');
        setShowQRCode(false);
        setIsLogin(true);
        setFormData({ ...formData, twoFactorCode: '' });
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Welcome Back!' : showQRCode ? 'Setup 2FA' : 'Create Account'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin 
              ? 'Sign in with your username and 2FA code' 
              : showQRCode 
                ? 'Scan QR code with your authenticator app'
                : 'Create your account with 2FA security'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {showQRCode ? (
          <div className="space-y-4">
            {/* QR Code Display */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                <Shield className="w-5 h-5 inline mr-2" />
                Set Up Two-Factor Authentication
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Step 1:</strong> Install an authenticator app
                  </p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Google Authenticator</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Authy</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Microsoft Authenticator</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Step 2:</strong> Scan this QR code
                  </p>
                  {qrCodeData && (
                    <div className="flex justify-center">
                      <img src={qrCodeData} alt="2FA QR Code" className="w-48 h-48" />
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Or enter manually:</strong>
                  </p>
                  <div className="bg-gray-100 p-2 rounded font-mono text-xs break-all">
                    {setupSecret}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Step 3:</strong> Enter the 6-digit code from your app
                  </p>
                  <input
                    type="text"
                    placeholder="000000"
                    value={formData.twoFactorCode}
                    onChange={(e) => setFormData({...formData, twoFactorCode: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-2xl font-bold tracking-wider"
                    maxLength="6"
                    pattern="[0-9]{6}"
                  />
                </div>
              </div>

              <button
                onClick={handleVerify2FA}
                disabled={loading || formData.twoFactorCode.length !== 6}
                className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none"
              >
                {loading ? 'Verifying...' : 'Verify & Complete Setup'}
              </button>
            </div>

            <button
              onClick={() => {
                setShowQRCode(false);
                setIsLogin(true);
              }}
              className="w-full text-gray-600 hover:text-gray-700 font-medium text-sm"
            >
              Already set up? Go to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Key className="w-4 h-4 inline mr-1" />
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                required
                pattern="[a-z0-9_]+"
                title="Username can only contain lowercase letters, numbers, and underscores"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                
                {formData.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    >
                      <option value="K">Kindergarten</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={i+1}>Grade {i+1}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            
            {isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Smartphone className="w-4 h-4 inline mr-1" />
                  2FA Code
                </label>
                <input
                  type="text"
                  placeholder="6-digit code from your app"
                  value={formData.twoFactorCode}
                  onChange={(e) => setFormData({...formData, twoFactorCode: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-center text-xl font-semibold tracking-wider"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || (isLogin && formData.twoFactorCode.length !== 6)}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        )}

        {!showQRCode && (
          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            
            {isLogin && (
              <div>
                <button
                  onClick={() => window.open('/reset-2fa', '_blank')}
                  className="text-sm text-gray-500 hover:text-gray-600"
                >
                  Lost access to authenticator?
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Shield className="w-4 h-4 mr-1" />
            Secured with Two-Factor Authentication
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
