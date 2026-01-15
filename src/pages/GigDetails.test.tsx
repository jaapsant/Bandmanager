import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GigDetails } from './GigDetails';
import { Gig, BandMember } from '../types';
import { UseGigDetailsReturn } from '../hooks/useGigDetails';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'gig-1' }),
}));

// Mock data hook
vi.mock('../data', () => ({
  useStatusOptions: () => [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'tentative', label: 'Tentative' },
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

const createTestMember = (overrides: Partial<BandMember> = {}): BandMember => ({
  id: 'member-1',
  name: 'Test Member',
  email: 'test@example.com',
  instruments: ['Guitar'],
  order: 1,
  ...overrides,
});

// Create mock functions
const mockHandlers = {
  handleEdit: vi.fn(),
  handleCancel: vi.fn(),
  handleSave: vi.fn(),
  handleDelete: vi.fn(),
  handleBack: vi.fn(),
  setShowDeleteConfirm: vi.fn(),
  setEditedGig: vi.fn(),
  handleUpdateAvailability: vi.fn(),
  handleUpdateDrivingStatus: vi.fn(),
  updateAvailability: vi.fn(),
  updateNote: vi.fn(),
  toggleDriving: vi.fn(),
  updateMemberAvailability: vi.fn(),
  toggleMemberDriving: vi.fn(),
  handleSelectSingleDate: vi.fn(),
  formatTime: vi.fn(() => '19:00 - 22:00'),
  openInGoogleMaps: vi.fn(),
  updateGig: vi.fn(),
  t: (key: string) => key,
};

// Mock useGigDetails hook
const mockUseGigDetails = vi.fn();
vi.mock('../hooks/useGigDetails', () => ({
  useGigDetails: () => mockUseGigDetails(),
}));

// Mock child components to simplify testing
vi.mock('../components/GigDetails/GigHeader', () => ({
  GigHeader: ({ onEdit, onSave, onCancel, onDelete }: {
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid="gig-header">
      <button onClick={onEdit} data-testid="edit-btn">Edit</button>
      <button onClick={onSave} data-testid="save-btn">Save</button>
      <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
      <button onClick={onDelete} data-testid="delete-btn">Delete</button>
    </div>
  ),
}));

vi.mock('../components/GigDetails/GigInfoSection', () => ({
  GigInfoSection: () => <div data-testid="gig-info-section">Gig Info</div>,
}));

vi.mock('../components/GigDetails/UserAvailabilitySection', () => ({
  UserAvailabilitySection: () => <div data-testid="user-availability-section">User Availability</div>,
}));

vi.mock('../components/GigDetails/BandMembersSection', () => ({
  BandMembersSection: () => <div data-testid="band-members-section">Band Members</div>,
}));

vi.mock('../components/GigDetails/DeleteConfirmDialog', () => ({
  DeleteConfirmDialog: ({ isOpen, onConfirm, onCancel }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) => isOpen ? (
    <div data-testid="delete-dialog">
      <button onClick={onConfirm} data-testid="confirm-delete">Confirm</button>
      <button onClick={onCancel} data-testid="cancel-delete">Cancel</button>
    </div>
  ) : null,
}));

describe('GigDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading states', () => {
    it('should show not found message when gig is undefined', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: undefined,
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.getByText('gigDetails.errors.notFound')).toBeInTheDocument();
    });

    it('should show sign in message when user is undefined', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: undefined,
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.getByText('gigDetails.errors.signIn')).toBeInTheDocument();
    });
  });

  describe('rendering', () => {
    it('should render all sections when gig and user exist', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [createTestMember()],
        gigStats: { totalDrivers: 2, sortedInstruments: ['Guitar'], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.getByTestId('gig-header')).toBeInTheDocument();
      expect(screen.getByTestId('gig-info-section')).toBeInTheDocument();
      expect(screen.getByTestId('user-availability-section')).toBeInTheDocument();
      expect(screen.getByTestId('band-members-section')).toBeInTheDocument();
    });

    it('should render back button with correct text', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.getByText('common.backToGigs')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should display error message when error exists', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: 'Test error message',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should not display error container when no error', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call handleBack when back button is clicked', () => {
      const handleBack = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
        handleBack,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByText('common.backToGigs'));

      expect(handleBack).toHaveBeenCalled();
    });

    it('should call handleEdit when edit button is clicked', () => {
      const handleEdit = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
        handleEdit,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByTestId('edit-btn'));

      expect(handleEdit).toHaveBeenCalled();
    });

    it('should call handleSave when save button is clicked', () => {
      const handleSave = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: createTestGig(),
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: true,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
        handleSave,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByTestId('save-btn'));

      expect(handleSave).toHaveBeenCalled();
    });

    it('should call handleCancel when cancel button is clicked', () => {
      const handleCancel = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: createTestGig(),
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: true,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
        handleCancel,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByTestId('cancel-btn'));

      expect(handleCancel).toHaveBeenCalled();
    });
  });

  describe('delete confirmation dialog', () => {
    it('should show delete dialog when showDeleteConfirm is true', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: true,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    });

    it('should not show delete dialog when showDeleteConfirm is false', () => {
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
      });

      render(<GigDetails />);

      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
    });

    it('should call setShowDeleteConfirm when delete button is clicked', () => {
      const setShowDeleteConfirm = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: false,
        isPastGig: false,
        canEditGig: true,
        setShowDeleteConfirm,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByTestId('delete-btn'));

      expect(setShowDeleteConfirm).toHaveBeenCalledWith(true);
    });

    it('should call handleDelete when confirm delete is clicked', () => {
      const handleDelete = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: true,
        isPastGig: false,
        canEditGig: true,
        handleDelete,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByTestId('confirm-delete'));

      expect(handleDelete).toHaveBeenCalled();
    });

    it('should call setShowDeleteConfirm(false) when cancel delete is clicked', () => {
      const setShowDeleteConfirm = vi.fn();
      mockUseGigDetails.mockReturnValue({
        ...mockHandlers,
        gig: createTestGig(),
        user: { uid: 'user-1' },
        editedGig: null,
        bandMembers: [],
        gigStats: { totalDrivers: 0, sortedInstruments: [], membersByInstrument: {} },
        isEditing: false,
        error: '',
        showDeleteConfirm: true,
        isPastGig: false,
        canEditGig: true,
        setShowDeleteConfirm,
      });

      render(<GigDetails />);

      fireEvent.click(screen.getByTestId('cancel-delete'));

      expect(setShowDeleteConfirm).toHaveBeenCalledWith(false);
    });
  });
});
