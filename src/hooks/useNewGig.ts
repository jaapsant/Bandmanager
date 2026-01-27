import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Gig } from '../types';
import { useGigs } from '../context/GigContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { sendEmail, getAllUserEmails } from '../utils/emailService';
import { getNewGigEmailTemplate } from '../utils/emailTemplates';
import { validateGig, ValidationMessages } from '../utils/gigValidation';
import { calculateDistance } from '../utils/distanceService';
import { TFunction } from 'i18next';

export interface NewGigFormData extends Partial<Gig> {
  name: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: string;
  isWholeDay: boolean;
  isMultiDay: boolean;
  dates: string[];
  location: string;
  distance: number | null;
  pay?: number | null;
  description?: string;
}

export interface UseNewGigReturn {
  // Form data
  formData: NewGigFormData;
  setFormData: React.Dispatch<React.SetStateAction<NewGigFormData>>;

  // Email notification
  sendEmailNotification: boolean;
  setSendEmailNotification: (send: boolean) => void;

  // UI state
  error: string;
  isSubmitting: boolean;
  isCalculatingDistance: boolean;

  // Computed values
  today: string;

  // Handlers
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleNameChange: (name: string) => void;
  handleMultiDayChange: (isMultiDay: boolean) => void;
  handleLocationChange: (location: string) => void;
  handleDistanceChange: (distance: string) => void;
  handleCalculateDistance: () => Promise<void>;
  handleDateChange: (date: string) => void;
  handleWholeDayChange: (isWholeDay: boolean) => void;
  handleStartTimeChange: (time: string) => void;
  handleEndTimeChange: (time: string) => void;
  handlePayChange: (pay: string) => void;
  handleDescriptionChange: (description: string) => void;
  handleAddDate: () => void;
  handleRemoveDate: (index: number) => void;
  handleDateAtIndexChange: (index: number, date: string) => void;
  navigateBack: () => void;

  // Translation
  t: TFunction;
}

const initialFormData: NewGigFormData = {
  name: '',
  date: '',
  startTime: '',
  endTime: '',
  status: 'pending',
  isWholeDay: false,
  isMultiDay: false,
  dates: [],
  location: '',
  distance: null,
  memberAvailability: {},
};

export function useNewGig(): UseNewGigReturn {
  const navigate = useNavigate();
  const { addGig } = useGigs();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<NewGigFormData>(initialFormData);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [sendEmailNotification, setSendEmailNotification] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
        if (!user) {
          throw new Error(t('newGig.errors.loginRequired'));
        }

        const validationMessages: ValidationMessages = {
          nameRequired: t('newGig.errors.requiredFields'),
          dateRequired: t('newGig.errors.requiredFields'),
          pastDate: t('newGig.errors.pastDate'),
          changePastDate: t('newGig.errors.pastDate'),
          emptyDates: t('newGig.errors.emptyDates'),
          timeRange: t('newGig.errors.timeRange'),
        };

        const validation = validateGig(formData, validationMessages);
        if (!validation.valid) {
          throw new Error(validation.error);
        }

        const gigData: Omit<Gig, 'id'> = {
          name: formData.name.trim(),
          date: formData.date,
          status: formData.status || 'pending',
          isWholeDay: formData.isMultiDay ? false : formData.isWholeDay || false,
          isMultiDay: formData.isMultiDay,
          dates: formData.isMultiDay ? (formData.dates || []).filter(Boolean) : [],
          memberAvailability: {},
          startTime:
            !formData.isMultiDay && !formData.isWholeDay ? formData.startTime || null : null,
          endTime:
            !formData.isMultiDay && !formData.isWholeDay ? formData.endTime || null : null,
          location: formData.location?.trim() || null,
          distance: formData.distance || null,
          pay: formData.pay || null,
          description: formData.description?.trim() || null,
          createdBy: user.uid,
        };

        const newGigId = await addGig(gigData);

        if (sendEmailNotification) {
          try {
            const emails = await getAllUserEmails();

            if (emails.length > 0) {
              const gigLink = `${window.location.origin}/gigs/${newGigId}`;
              const template = getNewGigEmailTemplate(
                { name: gigData.name, date: gigData.date },
                gigLink
              );

              await sendEmail({
                bcc: emails,
                ...template,
              });
            }
          } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        }
        navigate('/gigs');
      } catch (error) {
        console.error('Error creating gig:', error);
        setError(error instanceof Error ? error.message : t('newGig.errors.createFailed'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, formData, sendEmailNotification, addGig, navigate, t]
  );

  const handleNameChange = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, name }));
  }, []);

  const handleMultiDayChange = useCallback((isMultiDay: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isMultiDay,
      isWholeDay: false,
      startTime: null,
      endTime: null,
    }));
  }, []);

  const handleLocationChange = useCallback((location: string) => {
    setFormData((prev) => ({ ...prev, location }));
  }, []);

  const handleDistanceChange = useCallback((distance: string) => {
    setFormData((prev) => ({
      ...prev,
      distance: distance ? parseFloat(distance) : null,
    }));
  }, []);

  const handleCalculateDistance = useCallback(async () => {
    if (!formData.location || formData.location.trim().length === 0) {
      toast.error(t('newGig.form.distance.error.emptyLocation'));
      return;
    }

    setIsCalculatingDistance(true);
    try {
      const result = await calculateDistance(formData.location);

      if (result.success && result.distance !== undefined) {
        setFormData((prev) => ({ ...prev, distance: result.distance! }));
        toast.success(t('newGig.form.distance.calculated', { distance: result.distance }));
      } else {
        const errorKey = `newGig.form.distance.error.${result.error || 'apiError'}`;
        toast.error(t(errorKey));
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      toast.error(t('newGig.form.distance.error.apiError'));
    } finally {
      setIsCalculatingDistance(false);
    }
  }, [formData.location, t]);

  const handleDateChange = useCallback((date: string) => {
    setFormData((prev) => ({ ...prev, date }));
  }, []);

  const handleWholeDayChange = useCallback((isWholeDay: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isWholeDay,
      startTime: isWholeDay ? null : prev.startTime,
      endTime: isWholeDay ? null : prev.endTime,
    }));
  }, []);

  const handleStartTimeChange = useCallback((startTime: string) => {
    setFormData((prev) => ({ ...prev, startTime }));
  }, []);

  const handleEndTimeChange = useCallback((endTime: string) => {
    setFormData((prev) => ({ ...prev, endTime }));
  }, []);

  const handlePayChange = useCallback((pay: string) => {
    setFormData((prev) => ({
      ...prev,
      pay: pay ? parseFloat(pay) : null,
    }));
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setFormData((prev) => ({ ...prev, description }));
  }, []);

  const handleAddDate = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      dates: [...(prev.dates || []), ''],
    }));
  }, []);

  const handleRemoveDate = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      dates: prev.dates.filter((_, i) => i !== index),
    }));
  }, []);

  const handleDateAtIndexChange = useCallback((index: number, date: string) => {
    setFormData((prev) => {
      const newDates = [...(prev.dates || [])];
      newDates[index] = date;
      return { ...prev, dates: newDates };
    });
  }, []);

  const navigateBack = useCallback(() => {
    navigate('/gigs');
  }, [navigate]);

  return {
    // Form data
    formData,
    setFormData,

    // Email notification
    sendEmailNotification,
    setSendEmailNotification,

    // UI state
    error,
    isSubmitting,
    isCalculatingDistance,

    // Computed values
    today,

    // Handlers
    handleSubmit,
    handleNameChange,
    handleMultiDayChange,
    handleLocationChange,
    handleDistanceChange,
    handleCalculateDistance,
    handleDateChange,
    handleWholeDayChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handlePayChange,
    handleDescriptionChange,
    handleAddDate,
    handleRemoveDate,
    handleDateAtIndexChange,
    navigateBack,

    // Translation
    t,
  };
}
