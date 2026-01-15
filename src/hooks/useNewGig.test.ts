import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNewGig } from './useNewGig';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock GigContext
const mockAddGig = vi.fn();
vi.mock('../context/GigContext', () => ({
  useGigs: () => ({
    addGig: mockAddGig,
  }),
}));

// Mock AuthContext
const mockUser = { uid: 'user-1', displayName: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock email service
const mockSendEmail = vi.fn();
const mockGetAllUserEmails = vi.fn();
vi.mock('../utils/emailService', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  getAllUserEmails: () => mockGetAllUserEmails(),
}));

// Mock email templates
vi.mock('../utils/emailTemplates', () => ({
  getNewGigEmailTemplate: () => ({
    subject: 'Test Subject',
    html: '<p>Test Body</p>',
  }),
}));

// Mock validation
vi.mock('../utils/gigValidation', () => ({
  validateGig: (formData: { name?: string; date?: string }) => {
    if (!formData.name || !formData.date) {
      return { valid: false, error: 'Validation error' };
    }
    return { valid: true };
  },
}));

describe('useNewGig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockAddGig.mockResolvedValue('new-gig-id');
    mockGetAllUserEmails.mockResolvedValue(['test@example.com']);
    mockSendEmail.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should have empty form data initially', () => {
      const { result } = renderHook(() => useNewGig());

      expect(result.current.formData.name).toBe('');
      expect(result.current.formData.date).toBe('');
      expect(result.current.formData.isMultiDay).toBe(false);
      expect(result.current.formData.isWholeDay).toBe(false);
    });

    it('should have email notification enabled by default', () => {
      const { result } = renderHook(() => useNewGig());

      expect(result.current.sendEmailNotification).toBe(true);
    });

    it('should not be submitting initially', () => {
      const { result } = renderHook(() => useNewGig());

      expect(result.current.isSubmitting).toBe(false);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useNewGig());

      expect(result.current.error).toBe('');
    });

    it('should have today date computed', () => {
      const { result } = renderHook(() => useNewGig());
      const today = new Date().toISOString().split('T')[0];

      expect(result.current.today).toBe(today);
    });
  });

  describe('form field handlers', () => {
    it('should update name', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleNameChange('Test Gig');
      });

      expect(result.current.formData.name).toBe('Test Gig');
    });

    it('should update multi-day and reset time fields', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleStartTimeChange('10:00');
        result.current.handleEndTimeChange('12:00');
      });

      act(() => {
        result.current.handleMultiDayChange(true);
      });

      expect(result.current.formData.isMultiDay).toBe(true);
      expect(result.current.formData.isWholeDay).toBe(false);
      expect(result.current.formData.startTime).toBeNull();
      expect(result.current.formData.endTime).toBeNull();
    });

    it('should update location', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleLocationChange('Amsterdam');
      });

      expect(result.current.formData.location).toBe('Amsterdam');
    });

    it('should update distance', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleDistanceChange('25.5');
      });

      expect(result.current.formData.distance).toBe(25.5);
    });

    it('should set distance to null for empty string', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleDistanceChange('25');
      });

      act(() => {
        result.current.handleDistanceChange('');
      });

      expect(result.current.formData.distance).toBeNull();
    });

    it('should update date', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleDateChange('2026-02-15');
      });

      expect(result.current.formData.date).toBe('2026-02-15');
    });

    it('should update whole day and reset time fields', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleStartTimeChange('10:00');
        result.current.handleEndTimeChange('12:00');
      });

      act(() => {
        result.current.handleWholeDayChange(true);
      });

      expect(result.current.formData.isWholeDay).toBe(true);
      expect(result.current.formData.startTime).toBeNull();
      expect(result.current.formData.endTime).toBeNull();
    });

    it('should update start time', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleStartTimeChange('10:00');
      });

      expect(result.current.formData.startTime).toBe('10:00');
    });

    it('should update end time', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleEndTimeChange('18:00');
      });

      expect(result.current.formData.endTime).toBe('18:00');
    });

    it('should update pay', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handlePayChange('150.50');
      });

      expect(result.current.formData.pay).toBe(150.5);
    });

    it('should set pay to null for empty string', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handlePayChange('100');
      });

      act(() => {
        result.current.handlePayChange('');
      });

      expect(result.current.formData.pay).toBeNull();
    });

    it('should update description', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleDescriptionChange('Test description');
      });

      expect(result.current.formData.description).toBe('Test description');
    });
  });

  describe('multi-day date handlers', () => {
    it('should add a date', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleAddDate();
      });

      expect(result.current.formData.dates).toHaveLength(1);
      expect(result.current.formData.dates[0]).toBe('');
    });

    it('should remove a date', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleAddDate();
        result.current.handleAddDate();
      });

      expect(result.current.formData.dates).toHaveLength(2);

      act(() => {
        result.current.handleRemoveDate(0);
      });

      expect(result.current.formData.dates).toHaveLength(1);
    });

    it('should update date at index', () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleAddDate();
        result.current.handleAddDate();
      });

      act(() => {
        result.current.handleDateAtIndexChange(1, '2026-03-15');
      });

      expect(result.current.formData.dates[1]).toBe('2026-03-15');
    });
  });

  describe('email notification', () => {
    it('should toggle email notification', () => {
      const { result } = renderHook(() => useNewGig());

      expect(result.current.sendEmailNotification).toBe(true);

      act(() => {
        result.current.setSendEmailNotification(false);
      });

      expect(result.current.sendEmailNotification).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should navigate back to gigs', () => {
      const { result } = renderHook(() => useNewGig());

      result.current.navigateBack();

      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });
  });

  describe('form submission', () => {
    it('should create gig and navigate on successful submission', async () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleNameChange('Test Gig');
        result.current.handleDateChange('2026-02-15');
        result.current.handleStartTimeChange('10:00');
        result.current.handleEndTimeChange('18:00');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockAddGig).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });

    it('should send email notification when enabled', async () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleNameChange('Test Gig');
        result.current.handleDateChange('2026-02-15');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockGetAllUserEmails).toHaveBeenCalled();
      expect(mockSendEmail).toHaveBeenCalled();
    });

    it('should not send email notification when disabled', async () => {
      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleNameChange('Test Gig');
        result.current.handleDateChange('2026-02-15');
        result.current.setSendEmailNotification(false);
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should set error on validation failure', async () => {
      const { result } = renderHook(() => useNewGig());

      // Don't set required fields
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe('Validation error');
      expect(mockAddGig).not.toHaveBeenCalled();
    });

    it('should handle addGig error', async () => {
      mockAddGig.mockRejectedValueOnce(new Error('Failed to create gig'));

      const { result } = renderHook(() => useNewGig());

      act(() => {
        result.current.handleNameChange('Test Gig');
        result.current.handleDateChange('2026-02-15');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.error).toBe('Failed to create gig');
    });
  });

  describe('translation', () => {
    it('should provide translation function', () => {
      const { result } = renderHook(() => useNewGig());

      expect(result.current.t('test.key')).toBe('test.key');
    });
  });
});
