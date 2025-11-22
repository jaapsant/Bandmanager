import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBand } from '../context/BandContext';
import { getAuth, updatePassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { AvailabilityStatus } from '../components/AvailabilityStatus';
import { AvailabilityStatusValue } from '../types';

export function Profile() {
  const navigate = useNavigate();
  const { user, updateDisplayName } = useAuth();
  const { instruments: unsortedInstruments, bandMembers, updateMemberInstrument, updateMemberName, updateMemberSheetMusicPreference, updateMemberDrivingPreferences } = useBand();
  const auth = getAuth();
  const { t } = useTranslation();

  // Sort instruments alphabetically
  const instruments = [...unsortedInstruments].sort((a, b) => a.localeCompare(b));

  const [name, setName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('');
  // Driving preferences state
  const [drivingStatus, setDrivingStatus] = useState<AvailabilityStatusValue>('maybe');
  const [hasWinterTyres, setHasWinterTyres] = useState(false);
  const [hasGermanEnvironmentSticker, setHasGermanEnvironmentSticker] = useState(false);
  const [drivingRemark, setDrivingRemark] = useState('');
  const [wantsPrintedSheetMusic, setWantsPrintedSheetMusic] = useState(false);
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
  // Find the current user's band member data
  useEffect(() => {
    if (user) {
      const currentMember = bandMembers.find(member => member.id === user.uid);
      if (currentMember) {
        setSelectedInstrument(currentMember.instrument);
        setWantsPrintedSheetMusic(currentMember.wantsPrintedSheetMusic || false);

        // Initialize driving preferences
        if (currentMember.drivingAvailability) {
          setDrivingStatus(currentMember.drivingAvailability.status);
          setHasWinterTyres(currentMember.drivingAvailability.hasWinterTyres || false);
          setHasGermanEnvironmentSticker(currentMember.drivingAvailability.hasGermanEnvironmentSticker || false);
          setDrivingRemark(currentMember.drivingAvailability.remark || '');
        }
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
      await Promise.all([
        updateDisplayName(name),
        updateMemberName(auth.currentUser.uid, name)
      ]);

      setSuccess(t('profile.messages.success.nameUpdate'));
    } catch (error) {
      setError(t('profile.messages.error.nameUpdate'));
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
      setSuccess(t('profile.messages.success.instrumentUpdate'));
    } catch (error) {
      setError(t('profile.messages.error.instrumentUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSheetMusicPreference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateMemberSheetMusicPreference(user.uid, wantsPrintedSheetMusic);
      setSuccess(t('profile.messages.success.sheetMusicUpdate'));
    } catch (error) {
      setError(t('profile.messages.error.sheetMusicUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDrivingPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await updateMemberDrivingPreferences(user.uid, {
        status: drivingStatus,
        hasWinterTyres,
        hasGermanEnvironmentSticker,
        remark: drivingRemark
      });
      setSuccess(t('profile.messages.success.drivingUpdate'));
    } catch (error) {
      setError(t('profile.messages.error.drivingUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      setError(t('profile.messages.error.passwordMismatch'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updatePassword(auth.currentUser, newPassword);
      setSuccess(t('profile.messages.success.passwordUpdate'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError(t('profile.messages.error.passwordUpdate'));
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
          {t('profile.navigation.backToGigs')}
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {t('profile.sections.name.title')}
            </h2>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.sections.name.label')}
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {t('profile.sections.name.button')}
                </button>
              </div>
            </form>
          </div>

          {/* Update Instrument */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {t('profile.sections.instrument.title')}
            </h2>
            <form onSubmit={handleUpdateInstrument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.sections.instrument.label')}
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={selectedInstrument}
                  onChange={(e) => setSelectedInstrument(e.target.value)}
                >
                  <option value="">{t('profile.sections.instrument.placeholder')}</option>
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
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {t('profile.sections.instrument.button')}
                </button>
              </div>
            </form>
          </div>

          {/* Sheet Music Preference */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {t('profile.sections.sheetMusic.title')}
            </h2>
            <form onSubmit={handleUpdateSheetMusicPreference} className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="wantsPrintedSheetMusic"
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  checked={wantsPrintedSheetMusic}
                  onChange={(e) => setWantsPrintedSheetMusic(e.target.checked)}
                />
                <label htmlFor="wantsPrintedSheetMusic" className="ml-2 text-sm font-medium text-gray-700">
                  {t('profile.sections.sheetMusic.label')}
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {t('profile.sections.sheetMusic.button')}
                </button>
              </div>
            </form>
          </div>

          {/* Driving Preferences */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {t('profile.sections.driving.title')}
            </h2>
            <form onSubmit={handleUpdateDrivingPreferences} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('profile.sections.driving.availabilityLabel')}
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setDrivingStatus('available')}
                    className={`p-3 rounded-full transition-colors ${drivingStatus === 'available' ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-gray-100'}`}
                    title={t('gigs.available')}
                  >
                    <AvailabilityStatus status="available" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrivingStatus('unavailable')}
                    className={`p-3 rounded-full transition-colors ${drivingStatus === 'unavailable' ? 'bg-red-100 ring-2 ring-red-500' : 'hover:bg-gray-100'}`}
                    title={t('gigs.unavailable')}
                  >
                    <AvailabilityStatus status="unavailable" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrivingStatus('maybe')}
                    className={`p-3 rounded-full transition-colors ${drivingStatus === 'maybe' ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'hover:bg-gray-100'}`}
                    title={t('gigs.maybe')}
                  >
                    <AvailabilityStatus status="maybe" />
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasWinterTyres"
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    checked={hasWinterTyres}
                    onChange={(e) => setHasWinterTyres(e.target.checked)}
                  />
                  <label htmlFor="hasWinterTyres" className="ml-2 text-sm font-medium text-gray-700">
                    {t('profile.sections.driving.winterTyres')}
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasGermanEnvironmentSticker"
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    checked={hasGermanEnvironmentSticker}
                    onChange={(e) => setHasGermanEnvironmentSticker(e.target.checked)}
                  />
                  <label htmlFor="hasGermanEnvironmentSticker" className="ml-2 text-sm font-medium text-gray-700">
                    {t('profile.sections.driving.environmentSticker')}
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="drivingRemark" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.sections.driving.remarkLabel')}
                </label>
                <textarea
                  id="drivingRemark"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={drivingRemark}
                  onChange={(e) => setDrivingRemark(e.target.value)}
                  placeholder={t('profile.sections.driving.remarkPlaceholder')}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {t('profile.sections.driving.button')}
                </button>
              </div>
            </form>
          </div>

          {/* Update Password */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {t('profile.sections.password.title')}
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.sections.password.currentPassword')}
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.sections.password.newPassword')}
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.sections.password.confirmPassword')}
                </label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {t('profile.sections.password.button')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}