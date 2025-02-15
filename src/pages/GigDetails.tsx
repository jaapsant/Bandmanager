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
  const canEditGig = user?.emailVerified && (roles.admin || roles.bandManager);

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

  // Count available drivers
  const totalDrivers = Object.values(gig.memberAvailability).reduce((count, availability) => {
    if (availability.status === 'available' && availability.canDrive) {
      return count + 1;
    }
    return count;
  }, 0);

  // Group band members by instrument
  const membersByInstrument = bandMembers.reduce<Record<string, typeof bandMembers>>((acc, member) => {
    if (!acc[member.instrument]) {
      acc[member.instrument] = [];
    }
    acc[member.instrument].push(member);
    return acc;
  }, {});

  // Sort instruments and members within each group
  const sortedInstruments = Object.keys(membersByInstrument).sort();
  sortedInstruments.forEach(instrument => {
    membersByInstrument[instrument].sort((a, b) => a.name.localeCompare(b.name));
  });

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
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  className="text-3xl font-bold text-gray-900 w-full border-b border-gray-300 focus:outline-none focus:border-red-500"
                  value={editedGig?.name}
                  onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, name: e.target.value } : null)}
                  disabled={isPastGig}
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{gig.name}</h1>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <select
                  className={`px-4 py-2 rounded-full text-sm ${statusOptions.find(s => s.value === editedGig?.status)?.color}`}
                  value={editedGig?.status}
                  onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, status: e.target.value as Gig['status'] } : null)}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={`px-4 py-2 rounded-full text-sm ${
                  gig.status === 'completed' 
                    ? 'bg-blue-100 text-blue-800'
                    : statusOptions.find(s => s.value === gig.status)?.color
                }`}>
                  {gig.status === 'completed' ? 'Completed' : statusOptions.find(s => s.value === gig.status)?.label}
                </span>
              )}
              {canEditGig && !isEditing && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                 {/*  <button
                    onClick={handleSendEmail}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                    title="Email band members"
                  >
                    <Mail className="w-5 h-5" />
                  </button> */}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
              <AddToCalendar gig={gig} />
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-gray-100"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3" />
                  {isEditing ? (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center space-x-2">
                        <input
                          type="date"
                          className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                          value={editedGig?.date}
                          onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, date: e.target.value } : null)}
                          disabled={isPastGig}
                        />
                        {editedGig?.isMultiDay && (
                          <span className="text-sm text-gray-500">
                            (Primary date)
                          </span>
                        )}
                      </div>

                      {editedGig?.isMultiDay && (
                        <div className="space-y-2 pl-0">
                          {editedGig.dates.map((date, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="date"
                                className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                value={date}
                                onChange={(e) => {
                                  const newDates = [...editedGig.dates];
                                  newDates[index] = e.target.value;
                                  setEditedGig(prev => prev ? { ...prev, dates: newDates } : null);
                                }}
                                disabled={isPastGig}
                              />
                              <button
                                onClick={() => {
                                  const newDates = editedGig.dates.filter((_, i) => i !== index);
                                  setEditedGig(prev => prev ? { ...prev, dates: newDates } : null);
                                }}
                                className="p-1 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
                                title={t('newGig.form.dates.remove')}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              setEditedGig(prev => prev ? {
                                ...prev,
                                dates: [...prev.dates, ''] // Add an empty date instead of copying the primary date
                              } : null);
                            }}
                            className="flex items-center text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            {t('newGig.form.dates.addDate')}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span>{new Date(gig.date).toLocaleDateString()}</span>
                      {gig.isMultiDay && gig.dates.length > 0 && (
                        <div className="mt-1 pl-4 space-y-1 text-sm text-gray-500">
                          {gig.dates.map((date, index) => (
                            <div key={index}>
                              {new Date(date).toLocaleDateString()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  {isEditing ? (
                    <div className="flex items-center space-x-4">
                      {isPastGig ? (
                        <span>{formatTime()}</span>
                      ) : (
                        <>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={editedGig?.isWholeDay}
                              onChange={(e) => setEditedGig((prev: Gig | null) => prev ? {
                                ...prev,
                                isWholeDay: e.target.checked,
                                startTime: e.target.checked ? null : prev.startTime,
                                endTime: e.target.checked ? null : prev.endTime,
                              } : null)}
                            />
                            All Day
                          </label>
                          {!editedGig?.isWholeDay && (
                            <>
                              <input
                                type="time"
                                className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                value={editedGig?.startTime || ''}
                                onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, startTime: e.target.value } : null)}
                              />
                              <span>-</span>
                              <input
                                type="time"
                                className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                                value={editedGig?.endTime || ''}
                                onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, endTime: e.target.value } : null)}
                              />
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <span>{formatTime()}</span>
                  )}
                </div>
                
                <div className="flex items-center text-gray-600">
                  {isEditing ? (
                    <>
                      <MapPin className="w-5 h-5 mr-3" />
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                          value={editedGig?.location || ''}
                          onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, location: e.target.value } : null)}
                          placeholder="Enter location"
                        />
                        <input
                          type="number"
                          className="w-20 border-b border-gray-300 focus:outline-none focus:border-red-500"
                          value={editedGig?.distance || ''}
                          onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { 
                            ...prev, 
                            distance: e.target.value ? parseFloat(e.target.value) : null 
                          } : null)}
                          placeholder="km"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <span 
                        title="Open in Google Maps"
                        className="cursor-pointer hover:text-red-600"
                        onClick={() => gig.location && openInGoogleMaps(gig.location)}
                      >
                        <MapPin className="w-5 h-5 mr-3" />
                      </span>
                      <span>
                        {gig.location}
                        {gig.distance && (
                          <span className="text-gray-400 ml-2">
                            ({gig.distance} km)
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center text-gray-600">
                  <Euro className="w-5 h-5 mr-3" />
                  {isEditing ? (
                    <input
                      type="number"
                      className="border-b border-gray-300 focus:outline-none focus:border-red-500"
                      value={editedGig?.pay || ''}
                      onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, pay: e.target.value ? parseFloat(e.target.value) : null } : null)}
                      placeholder="Enter pay amount"
                    />
                  ) : (
                    gig.pay && <span>{gig.pay},-</span>
                  )}
                </div>
              </div>

              {(gig.description || isEditing) && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">{t('gigDetails.sections.description')}</h3>
                  {isEditing ? (
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={editedGig?.description || ''}
                      onChange={(e) => setEditedGig((prev: Gig | null) => prev ? { ...prev, description: e.target.value } : null)}
                      rows={4}
                      placeholder={t('gigDetails.sections.descriptionPlaceholder')}
                    />
                  ) : (
                    <p className="text-gray-600">{gig.description}</p>
                  )}
                </div>
              )}

              {/* Band Availability Overview */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('gigDetails.sections.bandAvailability')}</h3>
                  {!gig.isMultiDay && totalDrivers > 0 && (
                    <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Car className="w-4 h-4" />
                      <span className="ml-1 text-sm font-medium">{totalDrivers}</span>
                    </div>
                  )}
                </div>
                {gig.isMultiDay ? (
                  <MultiDateAvailabilityOverview 
                    gig={gig} 
                    onSelectSingleDate={handleSelectSingleDate}
                  />
                ) : (
                  <AvailabilityOverview memberAvailability={gig.memberAvailability} />
                )}
              </div>
            </div>

            <div>
              {/* Your Availability Section */}
              {!isPastGig && (
                <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{t('gigDetails.sections.yourAvailability')}</h3>
                {gig.isMultiDay ? (
                  <MultiDateAvailability
                    gig={gig}
                    onUpdateAvailability={handleUpdateAvailability}
                    onUpdateDrivingStatus={handleUpdateDrivingStatus}
                  />
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateAvailability('available', gig.memberAvailability[user.uid]?.canDrive ?? null)}
                          className={`p-2 rounded-full hover:bg-green-100 ${
                            gig.memberAvailability[user.uid]?.status === 'available' ? 'bg-green-100' : ''
                          }`}
                          title={t('gigs.available')}
                        >
                          <AvailabilityStatus status="available" />
                        </button>
                        <button
                          onClick={() => updateAvailability('unavailable', gig.memberAvailability[user.uid]?.canDrive ?? null)}
                          className={`p-2 rounded-full hover:bg-red-100 ${
                            gig.memberAvailability[user.uid]?.status === 'unavailable' ? 'bg-red-100' : ''
                          }`}
                          title={t('gigs.unavailable')}
                        >
                          <AvailabilityStatus status="unavailable" />
                        </button>
                        <button
                          onClick={() => updateAvailability('maybe', gig.memberAvailability[user.uid]?.canDrive ?? null)}
                          className={`p-2 rounded-full hover:bg-yellow-100 ${
                            gig.memberAvailability[user.uid]?.status === 'maybe' ? 'bg-yellow-100' : ''
                          }`}
                          title={t('gigs.maybe')}
                        >
                          <AvailabilityStatus status="maybe" />
                        </button>
                      </div>
                      {gig.memberAvailability[user.uid]?.status === 'available' && (
                        <button
                          onClick={toggleDriving}
                          className={`p-2 rounded-full hover:bg-blue-100 ${
                            gig.memberAvailability[user.uid]?.canDrive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                          }`}
                          title='Chauffeur'
                        >
                          <Car className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      className="w-full mt-2 p-2 text-sm border rounded-md"
                      placeholder={t('gigDetails.sections.notePlaceholder')}
                      value={gig.memberAvailability[user.uid]?.note || ''}
                      onChange={(e) => updateNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
              )}

              {/* Other Band Members Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('gigDetails.sections.bandMembers')}</h3>
                {gig.isMultiDay ? (
                  <MultiDateBandAvailability 
                    gig={gig}
                    onUpdateMemberAvailability={async (memberId, date, status) => {
                      if (!user) return;
                      
                      try {
                        const currentAvailability = gig.memberAvailability[memberId] || {
                          status: 'maybe',
                          dateAvailability: {}
                        };

                        const updatedAvailability = {
                          ...currentAvailability,
                          dateAvailability: {
                            ...currentAvailability.dateAvailability,
                            [date]: {
                              status,
                              note: currentAvailability.dateAvailability?.[date]?.note || '',
                              canDrive: currentAvailability.dateAvailability?.[date]?.canDrive || false
                            }
                          }
                        };

                        const updatedGig = {
                          ...gig,
                          memberAvailability: {
                            ...gig.memberAvailability,
                            [memberId]: updatedAvailability
                          }
                        };

                        await updateGig(updatedGig);
                      } catch (error) {
                        console.error('Error updating member availability:', error);
                        setError(error instanceof Error ? error.message : 'Failed to update member availability');
                      }
                    }}
                    onUpdateMemberDriving={async (memberId, date, canDrive) => {
                      if (!user) return;
                      
                      try {
                        const currentAvailability = gig.memberAvailability[memberId] || {
                          status: 'maybe',
                          dateAvailability: {}
                        };

                        const updatedAvailability = {
                          ...currentAvailability,
                          dateAvailability: {
                            ...currentAvailability.dateAvailability,
                            [date]: {
                              ...currentAvailability.dateAvailability?.[date],
                              canDrive
                            }
                          }
                        };

                        const updatedGig = {
                          ...gig,
                          memberAvailability: {
                            ...gig.memberAvailability,
                            [memberId]: updatedAvailability
                          }
                        };

                        await updateGig(updatedGig);
                      } catch (error) {
                        console.error('Error updating member driving status:', error);
                        setError(error instanceof Error ? error.message : 'Failed to update driving status');
                      }
                    }}
                  />
                ) : (
                  <div className="space-y-6">
                    {sortedInstruments.map((instrument) => (
                      <div key={instrument} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">{instrument}</h4>
                        <div className="space-y-3">
                          {membersByInstrument[instrument].map((member) => (
                            <div key={member.id} className="flex flex-col space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{member.name}</span>
                                <div className="flex items-center space-x-2">
                                  {(canEditGig && isPastGig) ? (
                                    <>
                                      <div className="flex space-x-1">
                                        <button
                                          onClick={() => updateMemberAvailability(member.id, 'available')}
                                          className={`p-1 rounded-full hover:bg-green-100 ${
                                            gig.memberAvailability[member.id]?.status === 'available' ? 'bg-green-100' : ''
                                          }`}
                                        >
                                          <AvailabilityStatus status="available" size="sm" />
                                        </button>
                                        <button
                                          onClick={() => updateMemberAvailability(member.id, 'unavailable')}
                                          className={`p-1 rounded-full hover:bg-red-100 ${
                                            gig.memberAvailability[member.id]?.status === 'unavailable' ? 'bg-red-100' : ''
                                          }`}
                                        >
                                          <AvailabilityStatus status="unavailable" size="sm" />
                                        </button>
                                        <button
                                          onClick={() => updateMemberAvailability(member.id, 'maybe')}
                                          className={`p-1 rounded-full hover:bg-yellow-100 ${
                                            gig.memberAvailability[member.id]?.status === 'maybe' ? 'bg-yellow-100' : ''
                                          }`}
                                        >
                                          <AvailabilityStatus status="maybe" size="sm" />
                                        </button>
                                      </div>
                                      {gig.memberAvailability[member.id]?.status === 'available' && (
                                        <button
                                          onClick={() => toggleMemberDriving(member.id)}
                                          className={`p-1 rounded-full hover:bg-blue-100 ${
                                            gig.memberAvailability[member.id]?.canDrive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                                          }`}
                                        >
                                          <Car className="w-4 h-4" />
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <AvailabilityStatus status={gig.memberAvailability[member.id]?.status} size="sm" />
                                      {gig.memberAvailability[member.id]?.status === 'available' && 
                                       gig.memberAvailability[member.id]?.canDrive && (
                                        <Car className="w-4 h-4 text-blue-600" />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              {gig.memberAvailability[member.id]?.note && (
                                <p className="text-sm text-gray-500 italic ml-4">
                                  {gig.memberAvailability[member.id].note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">{t('gigDetails.deleteModal.title')}</h3>
            <p className="text-gray-600 mb-6">{t('gigDetails.deleteModal.message')}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                {t('gigDetails.deleteModal.cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t('gigDetails.deleteModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}