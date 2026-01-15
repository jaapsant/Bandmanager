import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGigDetails } from './useGigDetails';
import { Gig, AvailabilityStatusValue, BandMember } from '../types';

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

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock contexts
const mockUpdateGig = vi.fn();
const mockDeleteGig = vi.fn();
const mockGigs: Gig[] = [];
const mockBandMembers: BandMember[] = [];
const mockUser = { uid: 'user-1', emailVerified: true };
const mockRoles = { admin: false, bandManager: true };

vi.mock('../context/GigContext', () => ({
  useGigs: () => ({
    gigs: mockGigs,
    updateGig: mockUpdateGig,
    deleteGig: mockDeleteGig,
  }),
}));

vi.mock('../context/BandContext', () => ({
  useBand: () => ({
    bandMembers: mockBandMembers,
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

vi.mock('./useRole', () => ({
  useRole: () => ({
    roles: mockRoles,
  }),
}));

vi.mock('./useGigStats', () => ({
  useGigStats: () => ({
    totalDrivers: 2,
    sortedInstruments: ['Guitar', 'Drums'],
    membersByInstrument: {},
  }),
}));

// Mock availability helpers
vi.mock('../utils/availabilityHelpers', () => ({
  updateMemberAvailabilityInGig: vi.fn((gig: Gig) => ({ ...gig, updated: true })),
  updateDrivingStatusInGig: vi.fn((gig: Gig) => ({ ...gig, drivingUpdated: true })),
  toggleMemberDrivingInGig: vi.fn((gig: Gig) => ({ ...gig, drivingToggled: true })),
  getMemberAvailability: vi.fn(() => ({ status: 'available', canDrive: false })),
}));

// Mock validation
vi.mock('../utils/gigValidation', () => ({
  validateGig: vi.fn(() => ({ valid: true })),
}));

// Helper to create test gig
const createTestGig = (overrides: Partial<Gig> = {}): Gig => ({
  id: 'gig-1',
  name: 'Test Gig',
  date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
  isMultiDay: false,
  dates: [],
  isWholeDay: false,
  startTime: '19:00',
  endTime: '22:00',
  location: 'Test Venue',
  memberAvailability: {},
  status: 'confirmed',
  ...overrides,
});

describe('useGigDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGigs.length = 0;
    mockBandMembers.length = 0;
    mockNavigate.mockClear();
    mockUpdateGig.mockClear();
    mockDeleteGig.mockClear();
    mockUpdateGig.mockResolvedValue(undefined);
    mockDeleteGig.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should return undefined gig when id not found', () => {
      const { result } = renderHook(() => useGigDetails('non-existent'));

      expect(result.current.gig).toBeUndefined();
    });

    it('should return the gig when found', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.gig).toEqual(testGig);
    });

    it('should not be in editing mode initially', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editedGig).toBeNull();
    });

    it('should have no error initially', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.error).toBe('');
    });
  });

  describe('isPastGig calculation', () => {
    it('should return false for future gig', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testGig = createTestGig({ date: tomorrow.toISOString().split('T')[0] });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.isPastGig).toBe(false);
    });

    it('should return true for past gig', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const testGig = createTestGig({ date: yesterday.toISOString().split('T')[0] });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.isPastGig).toBe(true);
    });

    it('should check last date for multi-day gigs', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const testGig = createTestGig({
        isMultiDay: true,
        date: yesterday.toISOString().split('T')[0],
        dates: [tomorrow.toISOString().split('T')[0]],
      });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      // Should be false because the last date is in the future
      expect(result.current.isPastGig).toBe(false);
    });
  });

  describe('canEditGig calculation', () => {
    it('should allow editing for verified band manager', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.canEditGig).toBe(true);
    });
  });

  describe('handleEdit', () => {
    it('should enter editing mode and copy gig data', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      act(() => {
        result.current.handleEdit();
      });

      expect(result.current.isEditing).toBe(true);
      expect(result.current.editedGig).toEqual(testGig);
    });
  });

  describe('handleCancel', () => {
    it('should exit editing mode and clear edited gig', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      act(() => {
        result.current.handleEdit();
      });

      expect(result.current.isEditing).toBe(true);

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.isEditing).toBe(false);
      expect(result.current.editedGig).toBeNull();
      expect(result.current.error).toBe('');
    });
  });

  describe('handleSave', () => {
    it('should save valid changes', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      act(() => {
        result.current.handleEdit();
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(mockUpdateGig).toHaveBeenCalled();
      expect(result.current.isEditing).toBe(false);
      expect(result.current.editedGig).toBeNull();
    });

    it('should show error for invalid changes', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { validateGig } = await import('../utils/gigValidation');
      vi.mocked(validateGig).mockReturnValueOnce({ valid: false, error: 'Validation failed' });

      const { result } = renderHook(() => useGigDetails('gig-1'));

      act(() => {
        result.current.handleEdit();
      });

      await act(async () => {
        await result.current.handleSave();
      });

      expect(result.current.error).toBe('Validation failed');
      expect(result.current.isEditing).toBe(true);
    });
  });

  describe('handleDelete', () => {
    it('should delete gig and navigate to gigs list', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockDeleteGig).toHaveBeenCalledWith('gig-1');
      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });

    it('should handle delete error', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);
      mockDeleteGig.mockRejectedValueOnce(new Error('Delete failed'));

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });

  describe('handleBack', () => {
    it('should navigate to gigs list for future gig', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const testGig = createTestGig({ date: tomorrow.toISOString().split('T')[0] });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });

    it('should navigate to gigs list with showHistory for past gig', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const testGig = createTestGig({ date: yesterday.toISOString().split('T')[0] });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      act(() => {
        result.current.handleBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/gigs', { state: { showHistory: true } });
    });
  });

  describe('availability updates', () => {
    it('handleUpdateAvailability should update gig', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.handleUpdateAvailability('2024-01-01', 'available', 'Test note');
      });

      expect(mockUpdateGig).toHaveBeenCalled();
    });

    it('updateAvailability should update gig for verified user', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.updateAvailability('available', true);
      });

      expect(mockUpdateGig).toHaveBeenCalled();
      expect(result.current.error).toBe('');
    });

    it('updateNote should update gig for verified user', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.updateNote('Test note');
      });

      expect(mockUpdateGig).toHaveBeenCalled();
    });

    it('toggleDriving should toggle driving status', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.toggleDriving();
      });

      expect(mockUpdateGig).toHaveBeenCalled();
    });
  });

  describe('member management', () => {
    it('updateMemberAvailability should update member status', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.updateMemberAvailability('member-1', 'available');
      });

      expect(mockUpdateGig).toHaveBeenCalled();
    });

    it('toggleMemberDriving should toggle member driving status', async () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.toggleMemberDriving('member-1');
      });

      expect(mockUpdateGig).toHaveBeenCalled();
    });
  });

  describe('formatTime', () => {
    it('should return all-day message for whole day gigs', () => {
      const testGig = createTestGig({ isWholeDay: true });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.formatTime()).toBe('gigDetails.time.allDay');
    });

    it('should return time range for gigs with times', () => {
      const testGig = createTestGig({ startTime: '19:00', endTime: '22:00' });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.formatTime()).toBe('19:00 - 22:00');
    });

    it('should return empty string for gigs without times', () => {
      const testGig = createTestGig({ startTime: null, endTime: null });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.formatTime()).toBe('');
    });
  });

  describe('openInGoogleMaps', () => {
    it('should open Google Maps with encoded location', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);
      const mockOpen = vi.fn();
      vi.spyOn(window, 'open').mockImplementation(mockOpen);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      result.current.openInGoogleMaps('Test Location');

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('Test%20Location'),
        '_blank'
      );
    });

    it('should not open for empty location', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);
      const mockOpen = vi.fn();
      vi.spyOn(window, 'open').mockImplementation(mockOpen);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      result.current.openInGoogleMaps('');

      expect(mockOpen).not.toHaveBeenCalled();
    });
  });

  describe('handleSelectSingleDate', () => {
    it('should convert multi-day gig to single day', async () => {
      const { toast } = await import('react-hot-toast');
      const testGig = createTestGig({
        isMultiDay: true,
        dates: ['2024-02-01'],
        memberAvailability: {
          'user-1': {
            status: 'available' as AvailabilityStatusValue,
            dateAvailability: {
              '2024-02-01': { status: 'available' as AvailabilityStatusValue, canDrive: true },
            },
          },
        },
      });
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      await act(async () => {
        await result.current.handleSelectSingleDate('2024-02-01');
      });

      expect(mockUpdateGig).toHaveBeenCalledWith(expect.objectContaining({
        isMultiDay: false,
        date: '2024-02-01',
        dates: [],
      }));
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('setShowDeleteConfirm', () => {
    it('should toggle delete confirmation dialog', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      expect(result.current.showDeleteConfirm).toBe(false);

      act(() => {
        result.current.setShowDeleteConfirm(true);
      });

      expect(result.current.showDeleteConfirm).toBe(true);

      act(() => {
        result.current.setShowDeleteConfirm(false);
      });

      expect(result.current.showDeleteConfirm).toBe(false);
    });
  });

  describe('setEditedGig', () => {
    it('should update edited gig', () => {
      const testGig = createTestGig();
      mockGigs.push(testGig);

      const { result } = renderHook(() => useGigDetails('gig-1'));

      const updatedGig = { ...testGig, name: 'Updated Name' };

      act(() => {
        result.current.setEditedGig(updatedGig);
      });

      expect(result.current.editedGig).toEqual(updatedGig);
    });
  });
});
