import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Settings: React.FC = () => {
  const { currentUser, updateUserProfile, updateUserEmail, updateUserPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (profileData.displayName !== currentUser?.displayName) {
        await updateUserProfile({ displayName: profileData.displayName });
      }
      
      if (profileData.email !== currentUser?.email) {
        await updateUserEmail(profileData.email);
      }
      
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await updateUserPassword(passwordData.newPassword);
      setMessage('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      setError(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8" style={{ paddingTop: '70px' }}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
          <p className="text-gray-600">Manage your profile and security settings</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <span className="text-green-500 mr-2">✅</span>
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl text-white">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
              <p className="text-gray-600">Update your account details</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={profileData.displayName}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
              <p className="mt-1 text-sm text-gray-500">
                You may need to verify your new email address
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl text-white">🔒</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
              <p className="text-gray-600">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your new password"
              />
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Confirm your new password"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Information */}
        <div className="bg-white shadow-lg rounded-xl border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mr-4">
              <span className="text-xl text-white">ℹ️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Account Information</h2>
              <p className="text-gray-600">View your account details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {currentUser?.uid}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {currentUser?.email === 'admin@carsale.com' ? 'Administrator' : 'Standard User'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Verified</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  (currentUser as any)?.emailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {(currentUser as any)?.emailVerified ? '✅ Verified' : '⚠️ Unverified'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                {(currentUser as any)?.metadata?.creationTime 
                  ? new Date((currentUser as any).metadata.creationTime).toLocaleDateString()
                  : 'Unknown'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
