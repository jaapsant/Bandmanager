import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Gig, MemberAvailability, AvailabilityStatusValue } from '../types';
import { useGigs } from '../context/GigContext';
import { useBand } from '../context/BandContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from './useRole';
import { useGigStats } from './useGigStats';
import {
  updateMemberAvailabilityInGig,
  updateDrivingStatusInGig,
  toggleMemberDrivingInGig,
  getMemberAvailability
} from '../utils/availabilityHelpers';
import { validateGig, ValidationMessages } from '../utils/gigValidation';

export interface UseGigDetailsReturn {
  // Data
  gig: Gig | undefined;
  allGigs: Gig[];
  editedGig: Gig | null;
  user: ReturnType<typeof useAuth>['user'];
  bandMembers: ReturnType<typeof useBand>['bandMembers'];
  gigStats: ReturnType<typeof useGigStats>;

  // State
  isEditing: boolean;
  error: string;
  showDeleteConfirm: boolean;
  isPastGig: boolean;
  canEditGig: boolean;

  // Actions
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleBack: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setEditedGig: (gig: Gig | null) => void;

  // Availability handlers
  handleUpdateAvailability: (date: string, status: AvailabilityStatusValue, note?: string) => Promise<void>;
  handleUpdateDrivingStatus: (date: string, canDrive: boolean) => Promise<void>;
  updateAvailability: (status: AvailabilityStatusValue, canDrive: boolean | null) => Promise<void>;
  updateNote: (note: string) => Promise<void>;
  toggleDriving: () => Promise<void>;

  // Member management handlers
  updateMemberAvailability: (memberId: string, status: AvailabilityStatusValue) => Promise<void>;
  toggleMemberDriving: (memberId: string) => Promise<void>;
  handleSelectSingleDate: (selectedDate: string) => Promise<void>;

  // Utilities
  formatTime: () => string;
  openInGoogleMaps: (location: string) => void;
  updateGig: (gig: Gig) => Promise<void>;

  // Translation
  t: ReturnType<typeof useTranslation>['t'];
}

export function useGigDetails(gigId: string | undefined): UseGigDetailsReturn {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { gigs, updateGig, deleteGig } = useGigs();
  const { bandMembers } = useBand();
  const { user } = useAuth();
  const { roles } = useRole();

  const gig = gigs.find((g) => g.id === gigId);
  const gigStats = useGigStats(gig, bandMembers);

  const [isEditing, setIsEditing] = useState(false);
  const [editedGig, setEditedGig] = useState<Gig | null>(null);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isPastGig = useMemo(() => {
    if (!gig) return false;
    const today = new Date();
    if (gig.isMultiDay) {
      const dates = [gig.date, ...gig.dates].map(d => new Date(d));
      const lastDate = new Date(Math.max(...dates.map(d => d.getTime())));
      lastDate.setHours(23, 59, 59, 999);
      return lastDate < today;
    }
    const gigDate = new Date(gig.date);
    gigDate.setHours(23, 59, 59, 999);
    return gigDate < today;
  }, [gig]);

  const canEditGig = !!(user?.emailVerified && (roles.admin || roles.bandManager));

  const handleEdit = useCallback(() => {
    if (gig) {
      setEditedGig(gig);
      setIsEditing(true);
    }
  }, [gig]);

  const handleCancel = useCallback(() => {
    setEditedGig(null);
    setIsEditing(false);
    setError('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!editedGig || !gig) return;

    try {
      if (!user) {
        throw new Error(t('gigDetails.errors.loginRequired'));
      }

      const validationMessages: ValidationMessages = {
        nameRequired: t('gigDetails.errors.requiredFields'),
        dateRequired: t('gigDetails.errors.requiredFields'),
        pastDate: t('gigDetails.errors.pastDate'),
        changePastDate: t('gigDetails.errors.pastDate'),
        emptyDates: t('gigDetails.errors.emptyDates'),
        timeRange: t('gigDetails.errors.timeRange'),
      };

      const validation = validateGig(editedGig, validationMessages, gig.date);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      await updateGig(editedGig);
      setIsEditing(false);
      setEditedGig(null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gigDetails.errors.updateFailed'));
    }
  }, [editedGig, gig, user, updateGig, t]);

  const handleDelete = useCallback(async () => {
    if (!gig) return;
    try {
      await deleteGig(gig.id);
      navigate('/gigs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gig');
    }
  }, [gig, deleteGig, navigate]);

  const handleBack = useCallback(() => {
    if (!gig) {
      navigate('/gigs');
      return;
    }
    const gigDate = new Date(gig.date);
    gigDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (gigDate < today) {
      navigate('/gigs', { state: { showHistory: true } });
    } else {
      navigate('/gigs');
    }
  }, [gig, navigate]);

  const handleUpdateAvailability = useCallback(async (date: string, status: AvailabilityStatusValue, note?: string) => {
    if (!user || !gig) return;

    try {
      if (!user.emailVerified) {
        throw new Error(t('gigDetails.errors.emailVerification'));
      }

      const updatedGig = updateMemberAvailabilityInGig(
        gig,
        user.uid,
        { status, note },
        gig.isMultiDay ? date : undefined
      );

      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(err instanceof Error ? err.message : t('gigDetails.errors.updateAvailability'));
    }
  }, [user, gig, updateGig, t]);

  const handleUpdateDrivingStatus = useCallback(async (date: string, canDrive: boolean) => {
    if (!user || !gig) return;

    try {
      const updatedGig = updateDrivingStatusInGig(gig, user.uid, date, canDrive);
      if (!updatedGig) return;

      await updateGig(updatedGig);
    } catch (err) {
      console.error('Error updating driving status:', err);
      setError(err instanceof Error ? err.message : t('gigDetails.errors.drivingStatus'));
    }
  }, [user, gig, updateGig, t]);

  const updateAvailability = useCallback(async (status: AvailabilityStatusValue, canDrive: boolean | null) => {
    if (!user?.emailVerified || !gig) {
      setError('Email verification required to update availability');
      return;
    }

    try {
      const currentAvailability = getMemberAvailability(gig, user.uid);
      const updatedGig = updateMemberAvailabilityInGig(
        gig,
        user.uid,
        {
          status,
          canDrive: canDrive !== null ? canDrive : (currentAvailability.canDrive ?? false)
        }
      );

      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability');
    }
  }, [user, gig, updateGig]);

  const updateNote = useCallback(async (note: string) => {
    if (!user?.emailVerified || !gig) {
      setError('Email verification required to update notes');
      return;
    }

    try {
      const updatedGig = updateMemberAvailabilityInGig(gig, user.uid, { note });

      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note');
    }
  }, [user, gig, updateGig]);

  const toggleDriving = useCallback(async () => {
    if (!user?.emailVerified || !gig) {
      setError('Email verification required to update driving status');
      return;
    }

    try {
      const updatedGig = toggleMemberDrivingInGig(gig, user.uid);
      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error toggling driving status:', err);
      setError('Failed to update driving status');
    }
  }, [user, gig, updateGig]);

  const updateMemberAvailability = useCallback(async (memberId: string, status: AvailabilityStatusValue) => {
    if (!gig) return;
    try {
      const updatedGig = updateMemberAvailabilityInGig(gig, memberId, { status });
      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating member availability:', err);
      setError('Failed to update member availability');
    }
  }, [gig, updateGig]);

  const toggleMemberDriving = useCallback(async (memberId: string) => {
    if (!gig) return;
    try {
      const updatedGig = toggleMemberDrivingInGig(gig, memberId);
      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating member driving status:', err);
      setError('Failed to update driving status');
    }
  }, [gig, updateGig]);

  const handleSelectSingleDate = useCallback(async (selectedDate: string) => {
    if (!user || !canEditGig || !gig) return;

    try {
      const updatedMemberAvailability: { [userId: string]: MemberAvailability } = {};

      Object.entries(gig.memberAvailability).forEach(([userId, availability]) => {
        const dateAvailability = availability.dateAvailability?.[selectedDate];
        if (dateAvailability) {
          const memberAvail: MemberAvailability = {
            status: dateAvailability.status,
            dateAvailability: {}
          };
          // Only include note and canDrive if they have values (Firestore doesn't accept undefined)
          if (dateAvailability.note) {
            memberAvail.note = dateAvailability.note;
          }
          if (dateAvailability.canDrive !== undefined && dateAvailability.canDrive !== null) {
            memberAvail.canDrive = dateAvailability.canDrive;
          }
          updatedMemberAvailability[userId] = memberAvail;
        }
      });

      const updatedGig: Gig = {
        ...gig,
        date: selectedDate,
        isMultiDay: false,
        dates: [],
        memberAvailability: updatedMemberAvailability
      };

      await updateGig(updatedGig);
      toast.success(t('gigDetails.messages.dateSelected'));
    } catch (err) {
      console.error('Error converting to single date:', err);
      setError(err instanceof Error ? err.message : t('gigDetails.errors.updateFailed'));
    }
  }, [user, canEditGig, gig, updateGig, t]);

  const formatTime = useCallback(() => {
    if (!gig) return '';
    if (gig.isWholeDay) {
      return t('gigDetails.time.allDay');
    }
    if (gig.startTime && gig.endTime) {
      return `${gig.startTime} - ${gig.endTime}`;
    }
    return '';
  }, [gig, t]);

  const openInGoogleMaps = useCallback((location: string) => {
    if (!location) return;
    const encodedLocation = encodeURIComponent(location);
    window.open(`https://www.google.com/maps/dir/Theaterkerk+Bemmel,+Markt+5,+6681+AE+Bemmel/${encodedLocation}`, '_blank');
  }, []);

  return {
    // Data
    gig,
    allGigs: gigs,
    editedGig,
    user,
    bandMembers,
    gigStats,

    // State
    isEditing,
    error,
    showDeleteConfirm,
    isPastGig,
    canEditGig,

    // Actions
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
    handleBack,
    setShowDeleteConfirm,
    setEditedGig,

    // Availability handlers
    handleUpdateAvailability,
    handleUpdateDrivingStatus,
    updateAvailability,
    updateNote,
    toggleDriving,

    // Member management handlers
    updateMemberAvailability,
    toggleMemberDriving,
    handleSelectSingleDate,

    // Utilities
    formatTime,
    openInGoogleMaps,
    updateGig,

    // Translation
    t,
  };
}
