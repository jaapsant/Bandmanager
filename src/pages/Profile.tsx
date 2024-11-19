import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBand } from '../context/BandContext';
import { getAuth, updatePassword } from 'firebase/auth';

export function Profile() {
  const navigate = useNavigate();
  const { user, updateDisplayName } = useAuth();
  const { instruments: unsortedInstruments, bandMembers, updateMemberInstrument, updateMemberName } = useBand();
  const auth = getAuth();

  // Sort instruments alphabetically
  const instruments = [...unsortedInstruments].sort((a, b) => a.localeCompare(b));

  const [name, setName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Update local state when user data changes
  useEffect(() => {
    if (user?.displayName) {
      setName(user.displayName);
    }
  }, [user?.displayName]);

  // Find the current user's band member data
  useEffect(() => {
    if (user) {
      const currentMember = bandMembers.find(member => member.id === user.uid);
      if (currentMember) {
        setSelectedInstrument(currentMember.instrument);
      }
    }
  }, [user, bandMembers]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Update both Firebase Auth profile and band member name
      await Promise.all([
        updateDisplayName(name),
        updateMemberName(auth.currentUser.uid, name)
      ]);

      setSuccess('Name updated successfully');
    } catch (error) {
      setError('Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInstrument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateMemberInstrument(user.uid, selectedInstrument);
      setSuccess('Instrument updated successfully');
    } catch (error) {
      setError('Failed to update instrument');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updatePassword(auth.currentUser, newPassword);
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password. Please sign in again if it has been a while.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/gigs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Gigs
        </button>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {/* Update Name */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Update Profile Name</h2>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Update Name
                </button>
              </div>
            </form>
          </div>

          {/* Update Instrument */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Update Instrument</h2>
            <form onSubmit={handleUpdateInstrument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Instrument
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedInstrument}
                  onChange={(e) => setSelectedInstrument(e.target.value)}
                >
                  <option value="">Select an instrument</option>
                  {instruments.map(instrument => (
                    <option key={instrument} value={instrument}>
                      {instrument}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Update Instrument
                </button>
              </div>
            </form>
          </div>

          {/* Update Password */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}