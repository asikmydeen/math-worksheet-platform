import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('Google login error:', error);
        navigate('/login?error=' + encodeURIComponent(error));
        return;
      }

      if (token) {
        try {
          // Store the token and fetch user info
          await loginWithToken(token);
          navigate('/dashboard');
        } catch (err) {
          console.error('Failed to process Google login:', err);
          navigate('/login?error=Failed to complete login');
        }
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-700">Completing sign in...</p>
        </div>
      </div>
    </div>
  );
}

export default GoogleCallback;