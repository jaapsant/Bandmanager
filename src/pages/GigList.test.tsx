import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GigList } from './GigList';
import { Gig } from '../types';
import { UseGigListReturn } from '../hooks/useGigList';

// Mock data hook
vi.mock('../data', () => ({
  useStatusOptions: () => [
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
    { value: 'tentative', label: 'Tentative', color: 'bg-yellow-100 text-yellow-800' },
  ],
}));

// Helper to create test gig
const createTestGig = (overrides: Partial<Gig> = {}): Gig => ({
  id: 'gig-1',
  name: 'Test Gig',
  date: '2024-03-15',
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

// Create mock handlers
const mockHandlers = {
  setShowHistory: vi.fn(),
  setViewMode: vi.fn(),
  toggleYear: vi.fn(),
  navigateToGig: vi.fn(),
  navigateToNewGig: vi.fn(),
  navigateToBandMembers: vi.fn(),
  navigateToYearOverview: vi.fn(),
  isYearExpanded: vi.fn(() => true),
  t: (key: string) => key,
};

// Mock useGigList hook
const mockUseGigList = vi.fn();
vi.mock('../hooks/useGigList', () => ({
  useGigList: () => mockUseGigList(),
}));

// Mock child components
vi.mock('../components/GigCard', () => ({
  GigCard: ({ gig }: { gig: Gig }) => (
    <div data-testid={`gig-card-${gig.id}`}>{gig.name}</div>
  ),
}));

vi.mock('../components/GigList', () => ({
  GigListHeader: ({
    showHistory,
    onSetShowHistory,
    onSetViewMode,
    onNavigateToNewGig,
    onNavigateToBandMembers,
  }: {
    showHistory: boolean;
    onSetShowHistory: (show: boolean) => void;
    onSetViewMode: (mode: 'grid' | 'compact') => void;
    onNavigateToNewGig: () => void;
    onNavigateToBandMembers: () => void;
  }) => (
    <div data-testid="gig-list-header">
      <span data-testid="show-history">{showHistory ? 'history' : 'upcoming'}</span>
      <button data-testid="toggle-history" onClick={() => onSetShowHistory(!showHistory)}>
        Toggle History
      </button>
      <button data-testid="set-grid" onClick={() => onSetViewMode('grid')}>
        Grid
      </button>
      <button data-testid="set-compact" onClick={() => onSetViewMode('compact')}>
        Compact
      </button>
      <button data-testid="new-gig" onClick={onNavigateToNewGig}>
        New Gig
      </button>
      <button data-testid="band-members" onClick={onNavigateToBandMembers}>
        Band Members
      </button>
    </div>
  ),
  GigCompactTable: ({
    gigs,
    showHistory,
    yearHeader,
    onNavigateToGig,
  }: {
    gigs: Gig[];
    showHistory: boolean;
    yearHeader?: string;
    onNavigateToGig: (id: string) => void;
  }) => (
    <div data-testid={yearHeader ? `compact-table-${yearHeader}` : 'compact-table'}>
      {yearHeader && <span data-testid="year-header">{yearHeader}</span>}
      <span data-testid="gig-count">{gigs.length}</span>
      <span data-testid="is-history">{showHistory ? 'history' : 'upcoming'}</span>
      {gigs.map(gig => (
        <button
          key={gig.id}
          data-testid={`navigate-${gig.id}`}
          onClick={() => onNavigateToGig(gig.id)}
        >
          {gig.name}
        </button>
      ))}
    </div>
  ),
}));

describe('GigList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading message when loading', () => {
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: true,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByText('gigList.loading')).toBeInTheDocument();
    });
  });

  describe('upcoming gigs view', () => {
    it('should render compact view by default', () => {
      const gigs = [createTestGig({ id: 'gig-1' }), createTestGig({ id: 'gig-2' })];
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: gigs,
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByTestId('compact-table')).toBeInTheDocument();
      expect(screen.getByTestId('gig-count')).toHaveTextContent('2');
      expect(screen.getByTestId('is-history')).toHaveTextContent('upcoming');
    });

    it('should render grid view when viewMode is grid', () => {
      const gigs = [createTestGig({ id: 'gig-1' }), createTestGig({ id: 'gig-2' })];
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: gigs,
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'grid',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByTestId('gig-card-gig-1')).toBeInTheDocument();
      expect(screen.getByTestId('gig-card-gig-2')).toBeInTheDocument();
    });

    it('should show empty state in grid view', () => {
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'grid',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByText('gigs.table.noGigs.upcoming')).toBeInTheDocument();
    });
  });

  describe('history view', () => {
    it('should render grouped past gigs by year', () => {
      const groupedGigs = {
        '2024': [createTestGig({ id: 'gig-2024', date: '2024-06-15' })],
        '2023': [createTestGig({ id: 'gig-2023', date: '2023-06-15' })],
      };
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: groupedGigs,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: true,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByTestId('compact-table-2024')).toBeInTheDocument();
      expect(screen.getByTestId('compact-table-2023')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call setShowHistory when toggle is clicked', () => {
      const setShowHistory = vi.fn();
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
        setShowHistory,
      });

      render(<GigList />);

      fireEvent.click(screen.getByTestId('toggle-history'));

      expect(setShowHistory).toHaveBeenCalledWith(true);
    });

    it('should call setViewMode when grid button is clicked', () => {
      const setViewMode = vi.fn();
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
        setViewMode,
      });

      render(<GigList />);

      fireEvent.click(screen.getByTestId('set-grid'));

      expect(setViewMode).toHaveBeenCalledWith('grid');
    });

    it('should call navigateToNewGig when new gig button is clicked', () => {
      const navigateToNewGig = vi.fn();
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
        navigateToNewGig,
      });

      render(<GigList />);

      fireEvent.click(screen.getByTestId('new-gig'));

      expect(navigateToNewGig).toHaveBeenCalled();
    });

    it('should call navigateToBandMembers when band members button is clicked', () => {
      const navigateToBandMembers = vi.fn();
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
        navigateToBandMembers,
      });

      render(<GigList />);

      fireEvent.click(screen.getByTestId('band-members'));

      expect(navigateToBandMembers).toHaveBeenCalled();
    });

    it('should call navigateToGig when gig is clicked in compact view', () => {
      const navigateToGig = vi.fn();
      const gigs = [createTestGig({ id: 'gig-1', name: 'Test Gig' })];
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: gigs,
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
        navigateToGig,
      });

      render(<GigList />);

      fireEvent.click(screen.getByTestId('navigate-gig-1'));

      expect(navigateToGig).toHaveBeenCalledWith('gig-1');
    });
  });

  describe('header props', () => {
    it('should pass correct props to header', () => {
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: false,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByTestId('gig-list-header')).toBeInTheDocument();
      expect(screen.getByTestId('show-history')).toHaveTextContent('upcoming');
    });

    it('should show history in header when showHistory is true', () => {
      mockUseGigList.mockReturnValue({
        ...mockHandlers,
        upcomingGigs: [],
        pastGigs: [],
        groupedPastGigs: {},
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showHistory: true,
        viewMode: 'compact',
        canManageGigs: true,
        expandedYears: {},
      });

      render(<GigList />);

      expect(screen.getByTestId('show-history')).toHaveTextContent('history');
    });
  });
});
