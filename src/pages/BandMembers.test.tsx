import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BandMembers } from './BandMembers';
import { BandMember } from '../types';
import { UseBandMembersReturn } from '../hooks/useBandMembers';

// Helper to create test member
const createTestMember = (overrides: Partial<BandMember> = {}): BandMember => ({
  id: 'member-1',
  name: 'Test Member',
  email: 'test@example.com',
  instruments: [],
  order: 1,
  ...overrides,
});

// Create mock handlers
const mockHandlers = {
  setShowInstrumentForm: vi.fn(),
  setNewInstrument: vi.fn(),
  handleDragStart: vi.fn(),
  handleDragEnd: vi.fn(),
  handleInstrumentSubmit: vi.fn(),
  handleRemoveInstrument: vi.fn(),
  navigateBack: vi.fn(),
  t: (key: string) => key,
};

// Mock useBandMembers hook
const mockUseBandMembers = vi.fn();
vi.mock('../hooks/useBandMembers', () => ({
  useBandMembers: () => mockUseBandMembers(),
}));

// Mock child components
vi.mock('../components/BandMembers', () => ({
  InstrumentMembersCard: ({
    onShowInstrumentForm,
    onRemoveInstrument,
  }: {
    onShowInstrumentForm: () => void;
    onRemoveInstrument: (instrument: string) => void;
  }) => (
    <div data-testid="instrument-members-card">
      <button data-testid="show-form" onClick={onShowInstrumentForm}>
        Show Form
      </button>
      <button data-testid="remove-instrument" onClick={() => onRemoveInstrument('Guitar')}>
        Remove
      </button>
    </div>
  ),
  DrivingPreferencesCard: ({ bandMembers }: { bandMembers: BandMember[] }) => (
    <div data-testid="driving-preferences-card">
      <span data-testid="member-count">{bandMembers.length}</span>
    </div>
  ),
  SheetMusicSummaryCard: ({
    totalWantsPrinted,
    totalMembers,
  }: {
    totalWantsPrinted: number;
    totalMembers: number;
  }) => (
    <div data-testid="sheet-music-card">
      <span data-testid="printed-count">{totalWantsPrinted}/{totalMembers}</span>
    </div>
  ),
}));

describe('BandMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading message when loading', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: true,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByText('bandMembers.loading')).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('should render instrument members card', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [createTestMember()],
        instruments: ['Guitar'],
        membersByInstrument: { Guitar: [createTestMember()] },
        sheetMusicSummary: [{ instrument: 'Guitar', wantsPrinted: 1, total: 1 }],
        totalWantsPrinted: 1,
        totalMembers: 1,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByTestId('instrument-members-card')).toBeInTheDocument();
    });

    it('should render driving preferences and sheet music cards when members exist', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [createTestMember()],
        instruments: ['Guitar'],
        membersByInstrument: { Guitar: [createTestMember()] },
        sheetMusicSummary: [{ instrument: 'Guitar', wantsPrinted: 1, total: 1 }],
        totalWantsPrinted: 1,
        totalMembers: 1,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByTestId('driving-preferences-card')).toBeInTheDocument();
      expect(screen.getByTestId('sheet-music-card')).toBeInTheDocument();
    });

    it('should not render driving and sheet music cards when no members', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.queryByTestId('driving-preferences-card')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sheet-music-card')).not.toBeInTheDocument();
    });

    it('should render back button', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByText('bandMembers.navigation.backToGigs')).toBeInTheDocument();
    });
  });

  describe('error and success messages', () => {
    it('should display error message when error exists', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: 'Test error message',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should display success message when success exists', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: 'Test success message',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByText('Test success message')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call navigateBack when back button is clicked', () => {
      const navigateBack = vi.fn();
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
        navigateBack,
      });

      render(<BandMembers />);

      fireEvent.click(screen.getByText('bandMembers.navigation.backToGigs'));

      expect(navigateBack).toHaveBeenCalled();
    });

    it('should call setShowInstrumentForm when show form button is clicked', () => {
      const setShowInstrumentForm = vi.fn();
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
        setShowInstrumentForm,
      });

      render(<BandMembers />);

      fireEvent.click(screen.getByTestId('show-form'));

      expect(setShowInstrumentForm).toHaveBeenCalledWith(true);
    });

    it('should call handleRemoveInstrument when remove button is clicked', () => {
      const handleRemoveInstrument = vi.fn();
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [],
        instruments: ['Guitar'],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 0,
        totalMembers: 0,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
        handleRemoveInstrument,
      });

      render(<BandMembers />);

      fireEvent.click(screen.getByTestId('remove-instrument'));

      expect(handleRemoveInstrument).toHaveBeenCalledWith('Guitar');
    });
  });

  describe('data display', () => {
    it('should pass correct member count to driving preferences card', () => {
      const members = [
        createTestMember({ id: 'm1' }),
        createTestMember({ id: 'm2' }),
        createTestMember({ id: 'm3' }),
      ];
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: members,
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [],
        totalWantsPrinted: 2,
        totalMembers: 3,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByTestId('member-count')).toHaveTextContent('3');
    });

    it('should pass correct sheet music counts', () => {
      mockUseBandMembers.mockReturnValue({
        ...mockHandlers,
        bandMembers: [createTestMember()],
        instruments: [],
        membersByInstrument: {},
        sheetMusicSummary: [{ instrument: 'Guitar', wantsPrinted: 2, total: 5 }],
        totalWantsPrinted: 2,
        totalMembers: 5,
        user: { uid: 'user-1', emailVerified: true },
        loading: false,
        showInstrumentForm: false,
        newInstrument: '',
        error: '',
        success: '',
        activeMember: null,
        canManageBand: true,
        sensors: [],
      });

      render(<BandMembers />);

      expect(screen.getByTestId('printed-count')).toHaveTextContent('2/5');
    });
  });
});
