import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProfile } from './useProfile';
import { BandMember } from '../types';

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

// Mock Firebase auth
const mockCurrentUser = { uid: 'user-1' };
const mockUpdatePassword = vi.fn();
vi.mock('firebase/auth', () => ({
  getAuth: () => ({
    currentUser: mockCurrentUser,
  }),
  updatePassword: (...args: unknown[]) => mockUpdatePassword(...args),
}));

// Mock contexts
const mockUser = { uid: 'user-1', displayName: 'Test User', emailVerified: true };
const mockUpdateDisplayName = vi.fn();
let mockBandMembers: BandMember[] = [];
let mockInstruments: string[] = [];
const mockUpdateMemberInstrument = vi.fn();
const mockUpdateMemberName = vi.fn();
const mockUpdateMemberSheetMusicPreference = vi.fn();
const mockUpdateMemberDrivingPreferences = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateDisplayName: mockUpdateDisplayName,
  }),
}));

vi.mock('../context/BandContext', () => ({
  useBand: () => ({
    instruments: mockInstruments,
    bandMembers: mockBandMembers,
    updateMemberInstrument: mockUpdateMemberInstrument,
    updateMemberName: mockUpdateMemberName,
    updateMemberSheetMusicPreference: mockUpdateMemberSheetMusicPreference,
    updateMemberDrivingPreferences: mockUpdateMemberDrivingPreferences,
  }),
}));

// Helper to create test member
const createTestMember = (overrides: Partial<BandMember> = {}): BandMember => ({
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  instruments: [],
  order: 1,
  instrument: 'Guitar',
  wantsPrintedSheetMusic: true,
  drivingAvailability: {
    status: 'available',
    hasWinterTyres: true,
    hasGermanEnvironmentSticker: true,
    remark: 'Test remark',
  },
  ...overrides,
});

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBandMembers = [];
    mockInstruments = [];
    mockNavigate.mockClear();
    mockUpdateDisplayName.mockResolvedValue(undefined);
    mockUpdateMemberInstrument.mockResolvedValue(undefined);
    mockUpdateMemberName.mockResolvedValue(undefined);
    mockUpdateMemberSheetMusicPreference.mockResolvedValue(undefined);
    mockUpdateMemberDrivingPreferences.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should return user data', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.user).toEqual(mockUser);
    });

    it('should initialize name from user displayName', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.name).toBe('Test User');
    });

    it('should sort instruments alphabetically', () => {
      mockInstruments = ['Drums', 'Bass', 'Guitar'];

      const { result } = renderHook(() => useProfile());

      expect(result.current.instruments).toEqual(['Bass', 'Drums', 'Guitar']);
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.error).toBe('');
    });

    it('should have no success message initially', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.success).toBe('');
    });

    it('should not be loading initially', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.loading).toBe(false);
    });
  });

  describe('member data initialization', () => {
    it('should initialize instrument from band member data', () => {
      const member = createTestMember({ instrument: 'Drums' });
      mockBandMembers = [member];

      const { result } = renderHook(() => useProfile());

      expect(result.current.selectedInstrument).toBe('Drums');
    });

    it('should initialize sheet music preference from band member data', () => {
      const member = createTestMember({ wantsPrintedSheetMusic: true });
      mockBandMembers = [member];

      const { result } = renderHook(() => useProfile());

      expect(result.current.wantsPrintedSheetMusic).toBe(true);
    });

    it('should initialize driving preferences from band member data', () => {
      const member = createTestMember({
        drivingAvailability: {
          status: 'available',
          hasWinterTyres: true,
          hasGermanEnvironmentSticker: true,
          remark: 'My car is big',
        },
      });
      mockBandMembers = [member];

      const { result } = renderHook(() => useProfile());

      expect(result.current.drivingStatus).toBe('available');
      expect(result.current.hasWinterTyres).toBe(true);
      expect(result.current.hasGermanEnvironmentSticker).toBe(true);
      expect(result.current.drivingRemark).toBe('My car is big');
    });
  });

  describe('form state updates', () => {
    it('should update name', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setName('New Name');
      });

      expect(result.current.name).toBe('New Name');
    });

    it('should update selected instrument', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setSelectedInstrument('Piano');
      });

      expect(result.current.selectedInstrument).toBe('Piano');
    });

    it('should update sheet music preference', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setWantsPrintedSheetMusic(true);
      });

      expect(result.current.wantsPrintedSheetMusic).toBe(true);
    });

    it('should update driving status', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setDrivingStatus('unavailable');
      });

      expect(result.current.drivingStatus).toBe('unavailable');
    });

    it('should update winter tyres checkbox', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setHasWinterTyres(true);
      });

      expect(result.current.hasWinterTyres).toBe(true);
    });

    it('should update environment sticker checkbox', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setHasGermanEnvironmentSticker(true);
      });

      expect(result.current.hasGermanEnvironmentSticker).toBe(true);
    });

    it('should update driving remark', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setDrivingRemark('New remark');
      });

      expect(result.current.drivingRemark).toBe('New remark');
    });

    it('should update password fields', () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setCurrentPassword('oldpass');
        result.current.setNewPassword('newpass');
        result.current.setConfirmPassword('newpass');
      });

      expect(result.current.currentPassword).toBe('oldpass');
      expect(result.current.newPassword).toBe('newpass');
      expect(result.current.confirmPassword).toBe('newpass');
    });
  });

  describe('handleUpdateName', () => {
    it('should update display name and member name', async () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setName('Updated Name');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateName(mockEvent);
      });

      expect(mockUpdateDisplayName).toHaveBeenCalledWith('Updated Name');
      expect(mockUpdateMemberName).toHaveBeenCalledWith('user-1', 'Updated Name');
      expect(result.current.success).toBe('profile.messages.success.nameUpdate');
    });

    it('should handle name update error', async () => {
      mockUpdateDisplayName.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateName(mockEvent);
      });

      expect(result.current.error).toBe('profile.messages.error.nameUpdate');
    });
  });

  describe('handleUpdateInstrument', () => {
    it('should update member instrument', async () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setSelectedInstrument('Piano');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateInstrument(mockEvent);
      });

      expect(mockUpdateMemberInstrument).toHaveBeenCalledWith('user-1', 'Piano');
      expect(result.current.success).toBe('profile.messages.success.instrumentUpdate');
    });

    it('should handle instrument update error', async () => {
      mockUpdateMemberInstrument.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateInstrument(mockEvent);
      });

      expect(result.current.error).toBe('profile.messages.error.instrumentUpdate');
    });
  });

  describe('handleUpdateSheetMusicPreference', () => {
    it('should update sheet music preference', async () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setWantsPrintedSheetMusic(true);
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateSheetMusicPreference(mockEvent);
      });

      expect(mockUpdateMemberSheetMusicPreference).toHaveBeenCalledWith('user-1', true);
      expect(result.current.success).toBe('profile.messages.success.sheetMusicUpdate');
    });

    it('should handle sheet music update error', async () => {
      mockUpdateMemberSheetMusicPreference.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateSheetMusicPreference(mockEvent);
      });

      expect(result.current.error).toBe('profile.messages.error.sheetMusicUpdate');
    });
  });

  describe('handleUpdateDrivingPreferences', () => {
    it('should update driving preferences', async () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setDrivingStatus('available');
        result.current.setHasWinterTyres(true);
        result.current.setHasGermanEnvironmentSticker(true);
        result.current.setDrivingRemark('My car is ready');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateDrivingPreferences(mockEvent);
      });

      expect(mockUpdateMemberDrivingPreferences).toHaveBeenCalledWith('user-1', {
        status: 'available',
        hasWinterTyres: true,
        hasGermanEnvironmentSticker: true,
        remark: 'My car is ready',
      });
      expect(result.current.success).toBe('profile.messages.success.drivingUpdate');
    });

    it('should handle driving preferences update error', async () => {
      mockUpdateMemberDrivingPreferences.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());
      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdateDrivingPreferences(mockEvent);
      });

      expect(result.current.error).toBe('profile.messages.error.drivingUpdate');
    });
  });

  describe('handleUpdatePassword', () => {
    it('should update password when passwords match', async () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setCurrentPassword('oldpass');
        result.current.setNewPassword('newpass123');
        result.current.setConfirmPassword('newpass123');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdatePassword(mockEvent);
      });

      expect(mockUpdatePassword).toHaveBeenCalledWith(mockCurrentUser, 'newpass123');
      expect(result.current.success).toBe('profile.messages.success.passwordUpdate');
      expect(result.current.currentPassword).toBe('');
      expect(result.current.newPassword).toBe('');
      expect(result.current.confirmPassword).toBe('');
    });

    it('should show error when passwords do not match', async () => {
      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setNewPassword('newpass123');
        result.current.setConfirmPassword('differentpass');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdatePassword(mockEvent);
      });

      expect(mockUpdatePassword).not.toHaveBeenCalled();
      expect(result.current.error).toBe('profile.messages.error.passwordMismatch');
    });

    it('should handle password update error', async () => {
      mockUpdatePassword.mockRejectedValueOnce(new Error('Update failed'));

      const { result } = renderHook(() => useProfile());

      act(() => {
        result.current.setNewPassword('newpass123');
        result.current.setConfirmPassword('newpass123');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleUpdatePassword(mockEvent);
      });

      expect(result.current.error).toBe('profile.messages.error.passwordUpdate');
    });
  });

  describe('navigation', () => {
    it('should navigate back to gigs', () => {
      const { result } = renderHook(() => useProfile());

      result.current.navigateBack();

      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });
  });

  describe('translation', () => {
    it('should provide translation function', () => {
      const { result } = renderHook(() => useProfile());

      expect(result.current.t('test.key')).toBe('test.key');
    });
  });
});
