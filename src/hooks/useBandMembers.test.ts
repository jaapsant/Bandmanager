import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBandMembers } from './useBandMembers';
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

// Mock contexts
const mockBandMembers: BandMember[] = [];
const mockInstruments: string[] = [];
const mockUpdateMemberInstrument = vi.fn();
const mockAddInstrument = vi.fn();
const mockRemoveInstrument = vi.fn();
let mockLoading = false;

vi.mock('../context/BandContext', () => ({
  useBand: () => ({
    bandMembers: mockBandMembers,
    instruments: mockInstruments,
    updateMemberInstrument: mockUpdateMemberInstrument,
    addInstrument: mockAddInstrument,
    removeInstrument: mockRemoveInstrument,
    loading: mockLoading,
  }),
}));

const mockUser = { uid: 'user-1', emailVerified: true };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

const mockRoles = { admin: false, bandManager: true };
vi.mock('./useRole', () => ({
  useRole: () => ({
    roles: mockRoles,
  }),
}));

// Helper to create test member
const createTestMember = (overrides: Partial<BandMember> = {}): BandMember => ({
  id: 'member-1',
  name: 'Test Member',
  email: 'test@example.com',
  instruments: [],
  order: 1,
  ...overrides,
});

describe('useBandMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBandMembers.length = 0;
    mockInstruments.length = 0;
    mockLoading = false;
    mockNavigate.mockClear();
    mockUpdateMemberInstrument.mockClear();
    mockAddInstrument.mockClear();
    mockRemoveInstrument.mockClear();
    mockUpdateMemberInstrument.mockResolvedValue(undefined);
    mockAddInstrument.mockResolvedValue(undefined);
    mockRemoveInstrument.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should return loading state', () => {
      mockLoading = true;
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.loading).toBe(true);
    });

    it('should return band members', () => {
      const member = createTestMember();
      mockBandMembers.push(member);

      const { result } = renderHook(() => useBandMembers());

      expect(result.current.bandMembers).toHaveLength(1);
      expect(result.current.bandMembers[0]).toEqual(member);
    });

    it('should sort instruments alphabetically with Unassigned first', () => {
      mockInstruments.push('Drums', 'Bass', 'Guitar');

      const { result } = renderHook(() => useBandMembers());

      expect(result.current.instruments[0]).toBe('bandMembers.instruments.unassigned');
      expect(result.current.instruments[1]).toBe('Bass');
      expect(result.current.instruments[2]).toBe('Drums');
      expect(result.current.instruments[3]).toBe('Guitar');
    });

    it('should have no error initially', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.error).toBe('');
    });

    it('should have no success message initially', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.success).toBe('');
    });

    it('should not show instrument form initially', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.showInstrumentForm).toBe(false);
    });

    it('should calculate canManageBand from roles', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.canManageBand).toBe(true);
    });
  });

  describe('membersByInstrument', () => {
    it('should group members by instrument', () => {
      const guitarMember = createTestMember({ id: 'guitar-1', name: 'Guitarist', instrument: 'Guitar' });
      const drumMember = createTestMember({ id: 'drums-1', name: 'Drummer', instrument: 'Drums' });
      mockBandMembers.push(guitarMember, drumMember);

      const { result } = renderHook(() => useBandMembers());

      expect(result.current.membersByInstrument['Guitar']).toHaveLength(1);
      expect(result.current.membersByInstrument['Drums']).toHaveLength(1);
    });

    it('should put members without instrument in Unassigned', () => {
      const unassignedMember = createTestMember({ id: 'unassigned-1', name: 'Unassigned', instrument: undefined });
      mockBandMembers.push(unassignedMember);

      const { result } = renderHook(() => useBandMembers());

      expect(result.current.membersByInstrument['Unassigned']).toHaveLength(1);
    });
  });

  describe('sheetMusicSummary', () => {
    it('should calculate sheet music summary by instrument', () => {
      const member1 = createTestMember({ id: 'm1', instrument: 'Guitar', wantsPrintedSheetMusic: true });
      const member2 = createTestMember({ id: 'm2', instrument: 'Guitar', wantsPrintedSheetMusic: false });
      const member3 = createTestMember({ id: 'm3', instrument: 'Drums', wantsPrintedSheetMusic: true });
      mockBandMembers.push(member1, member2, member3);

      const { result } = renderHook(() => useBandMembers());

      const guitarSummary = result.current.sheetMusicSummary.find(s => s.instrument === 'Guitar');
      expect(guitarSummary?.wantsPrinted).toBe(1);
      expect(guitarSummary?.total).toBe(2);
    });

    it('should calculate total wants printed', () => {
      const member1 = createTestMember({ id: 'm1', instrument: 'Guitar', wantsPrintedSheetMusic: true });
      const member2 = createTestMember({ id: 'm2', instrument: 'Drums', wantsPrintedSheetMusic: true });
      const member3 = createTestMember({ id: 'm3', instrument: 'Bass', wantsPrintedSheetMusic: false });
      mockBandMembers.push(member1, member2, member3);

      const { result } = renderHook(() => useBandMembers());

      expect(result.current.totalWantsPrinted).toBe(2);
    });

    it('should return total members count', () => {
      mockBandMembers.push(
        createTestMember({ id: 'm1' }),
        createTestMember({ id: 'm2' }),
        createTestMember({ id: 'm3' })
      );

      const { result } = renderHook(() => useBandMembers());

      expect(result.current.totalMembers).toBe(3);
    });
  });

  describe('instrument form', () => {
    it('should toggle instrument form visibility', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.showInstrumentForm).toBe(false);

      act(() => {
        result.current.setShowInstrumentForm(true);
      });

      expect(result.current.showInstrumentForm).toBe(true);
    });

    it('should update new instrument value', () => {
      const { result } = renderHook(() => useBandMembers());

      act(() => {
        result.current.setNewInstrument('Saxophone');
      });

      expect(result.current.newInstrument).toBe('Saxophone');
    });

    it('should submit new instrument', async () => {
      const { result } = renderHook(() => useBandMembers());

      act(() => {
        result.current.setNewInstrument('Saxophone');
        result.current.setShowInstrumentForm(true);
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleInstrumentSubmit(mockEvent);
      });

      expect(mockAddInstrument).toHaveBeenCalledWith('Saxophone');
      expect(result.current.showInstrumentForm).toBe(false);
      expect(result.current.newInstrument).toBe('');
      expect(result.current.success).toBe('bandMembers.messages.success.addInstrument');
    });

    it('should handle add instrument error', async () => {
      mockAddInstrument.mockRejectedValueOnce(new Error('Add failed'));

      const { result } = renderHook(() => useBandMembers());

      act(() => {
        result.current.setNewInstrument('Saxophone');
      });

      const mockEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

      await act(async () => {
        await result.current.handleInstrumentSubmit(mockEvent);
      });

      expect(result.current.error).toBe('Add failed');
    });
  });

  describe('remove instrument', () => {
    it('should remove instrument without members', async () => {
      mockInstruments.push('Saxophone');

      const { result } = renderHook(() => useBandMembers());

      await act(async () => {
        await result.current.handleRemoveInstrument('Saxophone');
      });

      expect(mockRemoveInstrument).toHaveBeenCalledWith('Saxophone');
      expect(result.current.success).toBe('bandMembers.messages.success.removeInstrument');
    });

    it('should not remove instrument with members', async () => {
      const member = createTestMember({ instrument: 'Guitar' });
      mockBandMembers.push(member);
      mockInstruments.push('Guitar');

      const { result } = renderHook(() => useBandMembers());

      await act(async () => {
        await result.current.handleRemoveInstrument('Guitar');
      });

      expect(mockRemoveInstrument).not.toHaveBeenCalled();
      expect(result.current.error).toBe('bandMembers.messages.error.removeInstrument.hasMembers');
    });

    it('should handle remove instrument error', async () => {
      mockRemoveInstrument.mockRejectedValueOnce(new Error('Remove failed'));

      const { result } = renderHook(() => useBandMembers());

      await act(async () => {
        await result.current.handleRemoveInstrument('Saxophone');
      });

      expect(result.current.error).toBe('Remove failed');
    });
  });

  describe('navigation', () => {
    it('should navigate back to gigs', () => {
      const { result } = renderHook(() => useBandMembers());

      result.current.navigateBack();

      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });
  });

  describe('drag and drop', () => {
    it('should set active member on drag start', () => {
      const member = createTestMember({ id: 'member-1', name: 'Drag Member' });
      mockBandMembers.push(member);

      const { result } = renderHook(() => useBandMembers());

      act(() => {
        result.current.handleDragStart({
          active: { id: 'member-1' },
          over: null,
        } as any);
      });

      expect(result.current.activeMember).toEqual(member);
    });

    it('should clear active member on drag end', async () => {
      const member = createTestMember({ id: 'member-1' });
      mockBandMembers.push(member);
      mockInstruments.push('Guitar');

      const { result } = renderHook(() => useBandMembers());

      act(() => {
        result.current.handleDragStart({
          active: { id: 'member-1' },
          over: null,
        } as any);
      });

      expect(result.current.activeMember).not.toBeNull();

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'member-1' },
          over: { id: 'Guitar' },
        } as any);
      });

      expect(result.current.activeMember).toBeNull();
    });

    it('should update member instrument on valid drop', async () => {
      const member = createTestMember({ id: 'member-1', instrument: undefined });
      mockBandMembers.push(member);
      mockInstruments.push('Guitar');

      const { result } = renderHook(() => useBandMembers());

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'member-1' },
          over: { id: 'Guitar' },
        } as any);
      });

      expect(mockUpdateMemberInstrument).toHaveBeenCalledWith('member-1', 'Guitar');
    });

    it('should not update when dropping on same instrument', async () => {
      const member = createTestMember({ id: 'member-1', instrument: 'Guitar' });
      mockBandMembers.push(member);
      mockInstruments.push('Guitar');

      const { result } = renderHook(() => useBandMembers());

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'member-1' },
          over: { id: 'Guitar' },
        } as any);
      });

      expect(mockUpdateMemberInstrument).not.toHaveBeenCalled();
    });

    it('should not update when dropping on invalid target', async () => {
      const member = createTestMember({ id: 'member-1' });
      mockBandMembers.push(member);

      const { result } = renderHook(() => useBandMembers());

      await act(async () => {
        await result.current.handleDragEnd({
          active: { id: 'member-1' },
          over: { id: 'InvalidTarget' },
        } as any);
      });

      expect(mockUpdateMemberInstrument).not.toHaveBeenCalled();
    });
  });

  describe('user data', () => {
    it('should provide user data', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('translation', () => {
    it('should provide translation function', () => {
      const { result } = renderHook(() => useBandMembers());

      expect(result.current.t('test.key')).toBe('test.key');
    });
  });
});
