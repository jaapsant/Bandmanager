import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBand } from '../context/BandContext';
import { getAuth, updatePassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { AvailabilityStatusValue, DrivingAvailability } from '../types';
import { TFunction } from 'i18next';

export interface UseProfileReturn {
  // User data
  user: ReturnType<typeof useAuth>['user'];

  // Form state - Name
  name: string;
  setName: (name: string) => void;

  // Form state - Instrument
  selectedInstrument: string;
  setSelectedInstrument: (instrument: string) => void;
  instruments: string[];

  // Form state - Sheet Music
  wantsPrintedSheetMusic: boolean;
  setWantsPrintedSheetMusic: (wants: boolean) => void;

  // Form state - Driving
  drivingStatus: AvailabilityStatusValue;
  setDrivingStatus: (status: AvailabilityStatusValue) => void;
  hasWinterTyres: boolean;
  setHasWinterTyres: (has: boolean) => void;
  hasGermanEnvironmentSticker: boolean;
  setHasGermanEnvironmentSticker: (has: boolean) => void;
  hasLeaseCar: boolean;
  setHasLeaseCar: (has: boolean) => void;
  drivingRemark: string;
  setDrivingRemark: (remark: string) => void;

  // Form state - Password
  currentPassword: string;
  setCurrentPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;

  // UI state
  error: string;
  success: string;
  loading: boolean;

  // Handlers
  handleUpdateName: (e: React.FormEvent) => Promise<void>;
  handleUpdateInstrument: (e: React.FormEvent) => Promise<void>;
  handleUpdateSheetMusicPreference: (e: React.FormEvent) => Promise<void>;
  handleUpdateDrivingPreferences: (e: React.FormEvent) => Promise<void>;
  handleUpdatePassword: (e: React.FormEvent) => Promise<void>;
  navigateBack: () => void;

  // Translation
  t: TFunction;
}

export function useProfile(): UseProfileReturn {
  const navigate = useNavigate();
  const { user, updateDisplayName } = useAuth();
  const {
    instruments: unsortedInstruments,
    bandMembers,
    updateMemberInstrument,
    updateMemberName,
    updateMemberSheetMusicPreference,
    updateMemberDrivingPreferences,
  } = useBand();
  const auth = getAuth();
  const { t } = useTranslation();

  // Sort instruments alphabetically
  const instruments = [...unsortedInstruments].sort((a, b) => a.localeCompare(b));

  // Form state - Name
  const [name, setName] = useState(user?.displayName || '');

  // Form state - Instrument
  const [selectedInstrument, setSelectedInstrument] = useState('');

  // Form state - Sheet Music
  const [wantsPrintedSheetMusic, setWantsPrintedSheetMusic] = useState(false);

  // Form state - Driving
  const [drivingStatus, setDrivingStatus] = useState<AvailabilityStatusValue>('maybe');
  const [hasWinterTyres, setHasWinterTyres] = useState(false);
  const [hasGermanEnvironmentSticker, setHasGermanEnvironmentSticker] = useState(false);
  const [hasLeaseCar, setHasLeaseCar] = useState(false);
  const [drivingRemark, setDrivingRemark] = useState('');

  // Form state - Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
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
      const currentMember = bandMembers.find((member) => member.id === user.uid);
      if (currentMember) {
        setSelectedInstrument(currentMember.instrument);
        setWantsPrintedSheetMusic(currentMember.wantsPrintedSheetMusic || false);

        // Initialize driving preferences
        if (currentMember.drivingAvailability) {
          setDrivingStatus(currentMember.drivingAvailability.status);
          setHasWinterTyres(currentMember.drivingAvailability.hasWinterTyres || false);
          setHasGermanEnvironmentSticker(
            currentMember.drivingAvailability.hasGermanEnvironmentSticker || false
          );
          setHasLeaseCar(currentMember.drivingAvailability.hasLeaseCar || false);
          setDrivingRemark(currentMember.drivingAvailability.remark || '');
        }
      }
    }
  }, [user, bandMembers]);

  const handleUpdateName = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!auth.currentUser) return;

      setError('');
      setSuccess('');
      setLoading(true);

      try {
        await Promise.all([
          updateDisplayName(name),
          updateMemberName(auth.currentUser.uid, name),
        ]);

        setSuccess(t('profile.messages.success.nameUpdate'));
      } catch (error) {
        setError(t('profile.messages.error.nameUpdate'));
      } finally {
        setLoading(false);
      }
    },
    [auth.currentUser, name, updateDisplayName, updateMemberName, t]
  );

  const handleUpdateInstrument = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [user, selectedInstrument, updateMemberInstrument, t]
  );

  const handleUpdateSheetMusicPreference = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [user, wantsPrintedSheetMusic, updateMemberSheetMusicPreference, t]
  );

  const handleUpdateDrivingPreferences = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;

      setError('');
      setSuccess('');
      setLoading(true);

      try {
        const drivingPreferences: DrivingAvailability = {
          status: drivingStatus,
          hasWinterTyres,
          hasGermanEnvironmentSticker,
          hasLeaseCar,
          remark: drivingRemark,
        };
        await updateMemberDrivingPreferences(user.uid, drivingPreferences);
        setSuccess(t('profile.messages.success.drivingUpdate'));
      } catch (error) {
        setError(t('profile.messages.error.drivingUpdate'));
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      drivingStatus,
      hasWinterTyres,
      hasGermanEnvironmentSticker,
      hasLeaseCar,
      drivingRemark,
      updateMemberDrivingPreferences,
      t,
    ]
  );

  const handleUpdatePassword = useCallback(
    async (e: React.FormEvent) => {
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
    },
    [auth.currentUser, newPassword, confirmPassword, t]
  );

  const navigateBack = useCallback(() => {
    navigate('/gigs');
  }, [navigate]);

  return {
    // User data
    user,

    // Form state - Name
    name,
    setName,

    // Form state - Instrument
    selectedInstrument,
    setSelectedInstrument,
    instruments,

    // Form state - Sheet Music
    wantsPrintedSheetMusic,
    setWantsPrintedSheetMusic,

    // Form state - Driving
    drivingStatus,
    setDrivingStatus,
    hasWinterTyres,
    setHasWinterTyres,
    hasGermanEnvironmentSticker,
    setHasGermanEnvironmentSticker,
    hasLeaseCar,
    setHasLeaseCar,
    drivingRemark,
    setDrivingRemark,

    // Form state - Password
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,

    // UI state
    error,
    success,
    loading,

    // Handlers
    handleUpdateName,
    handleUpdateInstrument,
    handleUpdateSheetMusicPreference,
    handleUpdateDrivingPreferences,
    handleUpdatePassword,
    navigateBack,

    // Translation
    t,
  };
}
