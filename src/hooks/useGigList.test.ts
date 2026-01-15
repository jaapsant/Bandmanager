import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGigList } from './useGigList';
import { Gig } from '../types';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { state: null };
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock contexts
const mockGigs: Gig[] = [];
const mockUser = { uid: 'user-1', emailVerified: true };
const mockRoles = { admin: false, bandManager: true };
let mockLoading = false;

vi.mock('../context/GigContext', () => ({
  useGigs: () => ({
    gigs: mockGigs,
    loading: mockLoading,
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

// Mock useViewModePreference
let mockViewMode: 'grid' | 'compact' = 'compact';
const mockSetViewMode = vi.fn((mode: 'grid' | 'compact') => {
  mockViewMode = mode;
});

vi.mock('./useViewModePreference', () => ({
  useViewModePreference: () => ({
    viewMode: mockViewMode,
    setViewMode: mockSetViewMode,
    deviceType: 'desktop',
  }),
}));

// Helper to create test gig
const createTestGig = (overrides: Partial<Gig> = {}): Gig => ({
  id: 'gig-1',
  name: 'Test Gig',
  date: new Date().toISOString().split('T')[0],
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

// Helper to create a date string
const createDateString = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

describe('useGigList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGigs.length = 0;
    mockLoading = false;
    mockViewMode = 'compact';
    mockNavigate.mockClear();
    mockSetViewMode.mockClear();
    mockLocation.state = null;
  });

  describe('initial state', () => {
    it('should return loading state', () => {
      mockLoading = true;
      const { result } = renderHook(() => useGigList());

      expect(result.current.loading).toBe(true);
    });

    it('should default to compact view mode', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.viewMode).toBe('compact');
    });

    it('should default to showing upcoming gigs', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.showHistory).toBe(false);
    });

    it('should calculate canManageGigs based on roles', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.canManageGigs).toBe(true);
    });
  });

  describe('gig sorting and filtering', () => {
    it('should separate upcoming and past gigs', () => {
      const futureGig = createTestGig({
        id: 'future-gig',
        date: createDateString(5),
      });
      const pastGig = createTestGig({
        id: 'past-gig',
        date: createDateString(-5),
      });
      mockGigs.push(futureGig, pastGig);

      const { result } = renderHook(() => useGigList());

      expect(result.current.upcomingGigs).toHaveLength(1);
      expect(result.current.upcomingGigs[0].id).toBe('future-gig');
      expect(result.current.pastGigs).toHaveLength(1);
    });

    it('should sort upcoming gigs in ascending order', () => {
      const gig1 = createTestGig({ id: 'gig-1', date: createDateString(10) });
      const gig2 = createTestGig({ id: 'gig-2', date: createDateString(5) });
      const gig3 = createTestGig({ id: 'gig-3', date: createDateString(15) });
      mockGigs.push(gig1, gig2, gig3);

      const { result } = renderHook(() => useGigList());

      expect(result.current.upcomingGigs[0].id).toBe('gig-2');
      expect(result.current.upcomingGigs[1].id).toBe('gig-1');
      expect(result.current.upcomingGigs[2].id).toBe('gig-3');
    });

    it('should sort past gigs in descending order', () => {
      const gig1 = createTestGig({ id: 'gig-1', date: createDateString(-10) });
      const gig2 = createTestGig({ id: 'gig-2', date: createDateString(-5) });
      const gig3 = createTestGig({ id: 'gig-3', date: createDateString(-15) });
      mockGigs.push(gig1, gig2, gig3);

      const { result } = renderHook(() => useGigList());

      expect(result.current.pastGigs[0].id).toBe('gig-2'); // most recent
      expect(result.current.pastGigs[1].id).toBe('gig-1');
      expect(result.current.pastGigs[2].id).toBe('gig-3'); // oldest
    });

    it('should group past gigs by year', () => {
      const gig2024 = createTestGig({ id: 'gig-2024', date: '2024-06-15' });
      const gig2023 = createTestGig({ id: 'gig-2023', date: '2023-06-15' });
      mockGigs.push(gig2024, gig2023);

      const { result } = renderHook(() => useGigList());

      expect(result.current.groupedPastGigs['2024']).toHaveLength(1);
      expect(result.current.groupedPastGigs['2023']).toHaveLength(1);
    });

    it('should handle multi-day gigs using earliest date for sorting', () => {
      const multiDayGig = createTestGig({
        id: 'multi-day',
        date: createDateString(10),
        isMultiDay: true,
        dates: [createDateString(11), createDateString(12)],
      });
      const singleDayGig = createTestGig({
        id: 'single-day',
        date: createDateString(5),
      });
      mockGigs.push(multiDayGig, singleDayGig);

      const { result } = renderHook(() => useGigList());

      expect(result.current.upcomingGigs[0].id).toBe('single-day');
      expect(result.current.upcomingGigs[1].id).toBe('multi-day');
    });
  });

  describe('view mode', () => {
    it('should return viewMode from useViewModePreference', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.viewMode).toBe('compact');
    });

    it('should call setViewMode from useViewModePreference', () => {
      const { result } = renderHook(() => useGigList());

      act(() => {
        result.current.setViewMode('grid');
      });

      expect(mockSetViewMode).toHaveBeenCalledWith('grid');
    });
  });

  describe('showHistory', () => {
    it('should toggle showHistory', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.showHistory).toBe(false);

      act(() => {
        result.current.setShowHistory(true);
      });

      expect(result.current.showHistory).toBe(true);
    });

    it('should respect location state for showHistory', () => {
      mockLocation.state = { showHistory: true };

      const { result } = renderHook(() => useGigList());

      expect(result.current.showHistory).toBe(true);
    });
  });

  describe('year expansion', () => {
    it('should expand current year by default', () => {
      const currentYear = new Date().getFullYear().toString();
      const { result } = renderHook(() => useGigList());

      expect(result.current.isYearExpanded(currentYear)).toBe(true);
    });

    it('should expand previous year by default', () => {
      const previousYear = (new Date().getFullYear() - 1).toString();
      const { result } = renderHook(() => useGigList());

      expect(result.current.isYearExpanded(previousYear)).toBe(true);
    });

    it('should collapse years older than 2 years by default', () => {
      const oldYear = (new Date().getFullYear() - 3).toString();
      const { result } = renderHook(() => useGigList());

      expect(result.current.isYearExpanded(oldYear)).toBe(false);
    });

    it('should toggle year expansion', () => {
      const currentYear = new Date().getFullYear().toString();
      const { result } = renderHook(() => useGigList());

      expect(result.current.isYearExpanded(currentYear)).toBe(true);

      act(() => {
        result.current.toggleYear(currentYear);
      });

      expect(result.current.isYearExpanded(currentYear)).toBe(false);

      act(() => {
        result.current.toggleYear(currentYear);
      });

      expect(result.current.isYearExpanded(currentYear)).toBe(true);
    });
  });

  describe('navigation', () => {
    it('should navigate to gig details', () => {
      const { result } = renderHook(() => useGigList());

      result.current.navigateToGig('gig-123');

      expect(mockNavigate).toHaveBeenCalledWith('/gig/gig-123');
    });

    it('should navigate to new gig page', () => {
      const { result } = renderHook(() => useGigList());

      result.current.navigateToNewGig();

      expect(mockNavigate).toHaveBeenCalledWith('/gigs/new');
    });

    it('should navigate to band members page', () => {
      const { result } = renderHook(() => useGigList());

      result.current.navigateToBandMembers();

      expect(mockNavigate).toHaveBeenCalledWith('/band-members');
    });

    it('should navigate to year overview', () => {
      const { result } = renderHook(() => useGigList());

      result.current.navigateToYearOverview('2024');

      expect(mockNavigate).toHaveBeenCalledWith('/year-overview/2024');
    });
  });

  describe('user data', () => {
    it('should provide user data', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('translation', () => {
    it('should provide translation function', () => {
      const { result } = renderHook(() => useGigList());

      expect(result.current.t('test.key')).toBe('test.key');
    });
  });
});
