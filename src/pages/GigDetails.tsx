import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Euro, ArrowLeft, Edit2, Save, X, Car, MapPin, Trash2, Mail, Plus } from 'lucide-react';
import { useStatusOptions } from '../data';
import { AvailabilityStatus } from '../components/AvailabilityStatus';
import { AvailabilityOverview } from '../components/AvailabilityOverview';
import { AddToCalendar } from '../components/AddToCalendar';
import { Gig, MemberAvailability, AvailabilityStatusValue } from '../types';
import { useGigs } from '../context/GigContext';
import { useBand } from '../context/BandContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { useTranslation } from 'react-i18next';
import { useGigStats } from '../hooks/useGigStats';
import { GigHeader } from '../components/GigDetails/GigHeader';
import { GigInfoSection } from '../components/GigDetails/GigInfoSection';
import { UserAvailabilitySection } from '../components/GigDetails/UserAvailabilitySection';
import { BandMembersSection } from '../components/GigDetails/BandMembersSection';
import { DeleteConfirmDialog } from '../components/GigDetails/DeleteConfirmDialog';
import { toast } from 'react-hot-toast';
import { MultiDateAvailability } from '../components/MultiDateAvailability';
import { MultiDateBandAvailability } from '../components/MultiDateBandAvailability';
import { MultiDateAvailabilityOverview } from '../components/MultiDateAvailabilityOverview';

export function GigDetails() {
  const { t } = useTranslation();
  const statusOptions = useStatusOptions();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { gigs, updateGig, deleteGig } = useGigs();
  const { bandMembers } = useBand();
  const { user } = useAuth();
  const { roles } = useRole();
  const gig = gigs.find((g) => g.id === id);

  // Allow editing if user is admin or band manager and is email verified
  const canEditGig = !!(user?.emailVerified && (roles.admin || roles.bandManager));

  const [isEditing, setIsEditing] = useState(false);
  const [editedGig, setEditedGig] = useState<Gig | null>(null);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!gig) return <div>{t('gigDetails.errors.notFound')}</div>;
  if (!user) return <div>{t('gigDetails.errors.signIn')}</div>;

  const handleEdit = () => {
    setEditedGig(gig);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedGig(null);
    setIsEditing(false);
    setError('');
  };

  const handleSave = async () => {
    if (editedGig) {
      try {
        if (!editedGig.name?.trim() || !editedGig.date) {
          throw new Error(t('gigDetails.errors.requiredFields'));
        }

        if (!user) {
          throw new Error(t('gigDetails.errors.loginRequired'));
        }

        // Validate all dates if it's a multi-day gig
        if (editedGig.isMultiDay) {
          const allDates = [editedGig.date, ...editedGig.dates].filter(Boolean);

          // Check for empty dates
          if (editedGig.dates.some(date => !date)) {
            throw new Error(t('gigDetails.errors.emptyDates'));
          }

          for (const date of allDates) {
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (checkDate < today) {
              throw new Error(t('gigDetails.errors.pastDate'));
            }
          }
        }

        if (!editedGig.isWholeDay && editedGig.startTime && editedGig.endTime) {
          const [startHours, startMinutes] = editedGig.startTime.split(':').map(Number);
          const [endHours, endMinutes] = editedGig.endTime.split(':').map(Number);

          if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
            throw new Error(t('gigDetails.errors.timeRange'));
          }
        }

        await updateGig(editedGig);
        setIsEditing(false);
        setEditedGig(null);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('gigDetails.errors.updateFailed'));
      }
    }
  };

  const handleUpdateAvailability = async (date: string, status: AvailabilityStatusValue, note?: string) => {
    if (!user) return;

    try {
      if (!user.emailVerified) {
        throw new Error(t('gigDetails.errors.emailVerification'));
      }

      // Get all dates for the gig
      const allDates = [gig.date, ...gig.dates];

      // Initialize a new availability object with proper structure
      const currentAvailability = gig.memberAvailability[user.uid] || {
        status: 'maybe',
        note: '',
        canDrive: false,
        dateAvailability: {}
      };

      if (gig.isMultiDay) {
        // Create a dateAvailability object with all dates initialized
        const initializedDateAvailability = { ...currentAvailability.dateAvailability };

        // Initialize any missing dates with 'maybe' status
        allDates.forEach(d => {
          if (!initializedDateAvailability[d]) {
            initializedDateAvailability[d] = {
              status: 'maybe',
              note: '',
              canDrive: false
            };
          }
        });

        // Update the specific date with new status
        const updatedAvailability: MemberAvailability = {
          ...currentAvailability,
          dateAvailability: {
            ...initializedDateAvailability,
            [date]: {
              status,
              note: note ?? initializedDateAvailability[date]?.note ?? '',
              canDrive: initializedDateAvailability[date]?.canDrive ?? false
            }
          }
        };

        // Calculate the overall status based on all dates
        const allStatuses = allDates.map(d => updatedAvailability.dateAvailability![d].status);
        const statusCount = allStatuses.reduce((acc, s) => {
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {} as Record<AvailabilityStatusValue, number>);

        const mainStatus = Object.entries(statusCount).reduce((a, b) =>
          (statusCount[a[0] as AvailabilityStatusValue] > statusCount[b[0] as AvailabilityStatusValue]) ? a : b
        )[0] as AvailabilityStatusValue;

        updatedAvailability.status = mainStatus;

        const updatedGig: Gig = {
          ...gig,
          memberAvailability: {
            ...gig.memberAvailability,
            [user.uid]: updatedAvailability
          }
        };

        await updateGig(updatedGig);
      } else {
        // For single-date gigs, update the main availability
        const updatedAvailability: MemberAvailability = {
          ...currentAvailability,
          status,
          note: note ?? '',
          canDrive: currentAvailability.canDrive || false,
          dateAvailability: {}
        };

        const updatedGig: Gig = {
          ...gig,
          memberAvailability: {
            ...gig.memberAvailability,
            [user.uid]: updatedAvailability
          }
        };

        await updateGig(updatedGig);
      }

      setError('');
    } catch (err) {
      console.error('Error updating availability:', err);
      setError(err instanceof Error ? err.message : t('gigDetails.errors.updateAvailability'));
    }
  };

  const handleUpdateDrivingStatus = async (date: string, canDrive: boolean) => {
    if (!user) return;

    try {
      const currentAvailability = gig.memberAvailability[user.uid];
      if (!currentAvailability?.dateAvailability?.[date]) return;

      const updatedAvailability = {
        ...currentAvailability,
        dateAvailability: {
          ...currentAvailability.dateAvailability,
          [date]: {
            ...currentAvailability.dateAvailability[date],
            canDrive
          }
        }
      };

      // Create the updated gig object
      const updatedGig = {
        ...gig,
        memberAvailability: {
          ...gig.memberAvailability,
          [user.uid]: updatedAvailability
        }
      };

      await updateGig(updatedGig);
    } catch (error) {
      console.error('Error updating driving status:', error);
      setError(error instanceof Error ? error.message : t('gigDetails.errors.drivingStatus'));
    }
  };

  const updateAvailability = async (status: 'available' | 'unavailable' | 'maybe', canDrive: boolean | null) => {
    if (!user?.emailVerified) {
      setError('Email verification required to update availability');
      return;
    }

    try {
      const currentAvailability = gig.memberAvailability[user.uid] || {};
      const updatedAvailability = {
        ...gig.memberAvailability,
        [user.uid]: {
          ...currentAvailability,
          status,
          note: currentAvailability.note || '',
          canDrive: canDrive !== null ? canDrive : currentAvailability.canDrive || null,
        },
      };

      const updatedGig = {
        ...gig,
        memberAvailability: updatedAvailability,
      };

      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating availability:', err);
      setError('Failed to update availability');
    }
  };

  const updateNote = async (note: string) => {
    if (!user?.emailVerified) {
      setError('Email verification required to update notes');
      return;
    }

    try {
      const currentAvailability = gig.memberAvailability[user.uid] || {};
      const updatedAvailability = {
        ...gig.memberAvailability,
        [user.uid]: {
          ...currentAvailability,
          status: currentAvailability.status || 'maybe',
          note,
          canDrive: currentAvailability.canDrive || false,
        },
      };

      const updatedGig = {
        ...gig,
        memberAvailability: updatedAvailability,
      };

      await updateGig(updatedGig);
      setError('');
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note');
    }
  };

  const toggleDriving = async () => {
    if (!user?.emailVerified) {
      setError('Email verification required to update driving status');
      return;
    }

    const currentAvailability = gig.memberAvailability[user.uid] || {};
    await updateAvailability(
      currentAvailability.status || 'maybe',
      !currentAvailability.canDrive
    );
  };

  const formatTime = () => {
    if (gig.isWholeDay) {
      return t('gigDetails.time.allDay');
    }
    if (gig.startTime && gig.endTime) {
      return `${gig.startTime} - ${gig.endTime}`;
    }
    return "";
  };

  // Get gig stats
  const gigStats = useGigStats(gig, bandMembers);

  const handleBack = () => {
    const gigDate = new Date(gig.date);
    gigDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (gigDate < today) {
      navigate('/gigs', { state: { showHistory: true } });
    } else {
      navigate('/gigs');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGig(gig.id);
      navigate('/gigs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete gig');
    }
  };

  const isPastGig = new Date(gig.date) < new Date();

  const openInGoogleMaps = (location: string) => {
    if (!location) return;
    const encodedLocation = encodeURIComponent(location);
    //https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
    window.open(`https://www.google.com/maps/dir/Theaterkerk+Bemmel,+Markt+5,+6681+AE+Bemmel/${encodedLocation}`, '_blank');
  };

  const updateMemberAvailability = async (memberId: string, status: 'available' | 'unavailable' | 'maybe') => {
    try {
      const currentAvailability = gig.memberAvailability[memberId] || {};
      const updatedAvailability = {
        ...gig.memberAvailability,
        [memberId]: {
          ...currentAvailability,
          status,
          note: currentAvailability.note || '',
          canDrive: currentAvailability.canDrive || false,
        },
      };

      await updateGig({
        ...gig,
        memberAvailability: updatedAvailability,
      });
      setError('');
    } catch (err) {
      console.error('Error updating member availability:', err);
      setError('Failed to update member availability');
    }
  };

  const toggleMemberDriving = async (memberId: string) => {
    try {
      const currentAvailability = gig.memberAvailability[memberId] || {};
      const updatedAvailability = {
        ...gig.memberAvailability,
        [memberId]: {
          ...currentAvailability,
          status: currentAvailability.status || 'maybe',
          note: currentAvailability.note || '',
          canDrive: !currentAvailability.canDrive,
        },
      };

      await updateGig({
        ...gig,
        memberAvailability: updatedAvailability,
      });
      setError('');
    } catch (err) {
      console.error('Error updating member driving status:', err);
      setError('Failed to update driving status');
    }
  };

  const handleSendEmail = async () => {
    try {
      const recipients = ['example@example.com']; // Replace with actual recipients
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gig,
          recipients,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast.success('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
      toast.error('Failed to send email');
    }
  };

  const handleSelectSingleDate = async (selectedDate: string) => {
    if (!user || !canEditGig) return;

    try {
      // Get the availability for the selected date
      const updatedMemberAvailability: { [userId: string]: MemberAvailability } = {};

      Object.entries(gig.memberAvailability).forEach(([userId, availability]) => {
        const dateAvailability = availability.dateAvailability?.[selectedDate];
        if (dateAvailability) {
          updatedMemberAvailability[userId] = {
            status: dateAvailability.status,
            note: dateAvailability.note || undefined,
            canDrive: dateAvailability.canDrive || undefined,
            dateAvailability: {}
          } as MemberAvailability;
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
    } catch (error) {
      console.error('Error converting to single date:', error);
      setError(error instanceof Error ? error.message : t('gigDetails.errors.updateFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToGigs')}
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <GigHeader
            gig={gig}
            editedGig={editedGig}
            isEditing={isEditing}
            isPastGig={isPastGig}
            canEditGig={canEditGig}
            statusOptions={statusOptions}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={() => setShowDeleteConfirm(true)}
            onUpdateGig={setEditedGig}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GigInfoSection
              gig={gig}
              editedGig={editedGig}
              isEditing={isEditing}
              isPastGig={isPastGig}
              totalDrivers={gigStats.totalDrivers}
              formatTime={formatTime}
              openInGoogleMaps={openInGoogleMaps}
              onUpdateGig={setEditedGig}
              onSelectSingleDate={handleSelectSingleDate}
              t={t}
            />

            <div>
              <UserAvailabilitySection
                gig={gig}
                user={user}
                isPastGig={isPastGig}
                updateAvailability={updateAvailability}
                updateNote={updateNote}
                toggleDriving={toggleDriving}
                onUpdateAvailability={handleUpdateAvailability}
                onUpdateDrivingStatus={handleUpdateDrivingStatus}
                t={t}
              />

              <BandMembersSection
                gig={gig}
                user={user}
                bandMembers={bandMembers}
                canEditGig={canEditGig}
                sortedInstruments={gigStats.sortedInstruments}
                membersByInstrument={gigStats.membersByInstrument}
                updateMemberAvailability={updateMemberAvailability}
                toggleMemberDriving={toggleMemberDriving}
                updateGig={updateGig}
                t={t}
              />


            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        gigName={gig.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        t={t}
      />
    </div>
  );
}