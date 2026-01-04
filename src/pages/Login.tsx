import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginFormData } from '../types';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', formData.email);
    setLoading(true);
    setError('');

    try {
      // Validate credentials
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      console.log('Calling login function...');
      await login(formData);
      console.log('Login successful');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDemoLogin = async (email: string, password: string) => {
    const data = { email, password };
    setFormData(data);
    console.log('Demo login attempt with:', email);
    setLoading(true);
    setError('');

    try {
      console.log('Calling login function with demo credentials...');
      await login(data);
      console.log('Demo login successful');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Demo login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your Daya Auto account</p>
        </div>

        {/* Demo accounts removed per request */}

        {/* Login Form */}
        <div className="bg-white shadow-xl rounded-xl border border-gray-100 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          )}

          {/* Helpful troubleshooting when Firebase returns invalid-credential */}
          {error && error.includes && error.includes('Invalid credential provided') && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <h4 className="font-semibold mb-2">Deployment / Authentication issue</h4>
              <p className="text-sm mb-2">The deployed site cannot reach Firebase with valid credentials. To fix this:</p>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Enable <strong>Email/Password</strong> in Firebase Console → Authentication → Sign-in method.</li>
                <li>Add your domain(s) in Firebase Console → Authentication → Authorized domains: <strong>pabasara200012.github.io</strong> and <strong>localhost</strong>.</li>
                <li>Ensure the Firebase config in <strong>src/services/firebase.ts</strong> matches your Firebase web app settings (apiKey, authDomain, projectId).</li>
                <li>Create the admin user in Firebase Console → Authentication → Users (email: <strong>dayaauto@gmail.com</strong>).</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">If you want, I can help apply these steps or show exact screenshots.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 Car Sale System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
