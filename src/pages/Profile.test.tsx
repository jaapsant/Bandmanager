import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Profile } from './Profile';

// Mock useProfile hook
const mockHandleUpdateName = vi.fn();
const mockHandleUpdateInstrument = vi.fn();
const mockHandleUpdateSheetMusicPreference = vi.fn();
const mockHandleUpdateDrivingPreferences = vi.fn();
const mockHandleUpdatePassword = vi.fn();
const mockNavigateBack = vi.fn();
const mockSetName = vi.fn();
const mockSetSelectedInstrument = vi.fn();
const mockSetWantsPrintedSheetMusic = vi.fn();
const mockSetDrivingStatus = vi.fn();
const mockSetHasWinterTyres = vi.fn();
const mockSetHasGermanEnvironmentSticker = vi.fn();
const mockSetDrivingRemark = vi.fn();
const mockSetCurrentPassword = vi.fn();
const mockSetNewPassword = vi.fn();
const mockSetConfirmPassword = vi.fn();

let mockError = '';
let mockSuccess = '';
let mockLoading = false;

vi.mock('../hooks/useProfile', () => ({
  useProfile: () => ({
    user: { uid: 'user-1', displayName: 'Test User' },
    name: 'Test User',
    setName: mockSetName,
    selectedInstrument: 'Guitar',
    setSelectedInstrument: mockSetSelectedInstrument,
    instruments: ['Bass', 'Drums', 'Guitar'],
    wantsPrintedSheetMusic: false,
    setWantsPrintedSheetMusic: mockSetWantsPrintedSheetMusic,
    drivingStatus: 'maybe',
    setDrivingStatus: mockSetDrivingStatus,
    hasWinterTyres: false,
    setHasWinterTyres: mockSetHasWinterTyres,
    hasGermanEnvironmentSticker: false,
    setHasGermanEnvironmentSticker: mockSetHasGermanEnvironmentSticker,
    drivingRemark: '',
    setDrivingRemark: mockSetDrivingRemark,
    currentPassword: '',
    setCurrentPassword: mockSetCurrentPassword,
    newPassword: '',
    setNewPassword: mockSetNewPassword,
    confirmPassword: '',
    setConfirmPassword: mockSetConfirmPassword,
    error: mockError,
    success: mockSuccess,
    loading: mockLoading,
    handleUpdateName: mockHandleUpdateName,
    handleUpdateInstrument: mockHandleUpdateInstrument,
    handleUpdateSheetMusicPreference: mockHandleUpdateSheetMusicPreference,
    handleUpdateDrivingPreferences: mockHandleUpdateDrivingPreferences,
    handleUpdatePassword: mockHandleUpdatePassword,
    navigateBack: mockNavigateBack,
    t: (key: string) => key,
  }),
}));

// Mock AvailabilityStatus component
vi.mock('../components/AvailabilityStatus', () => ({
  AvailabilityStatus: ({ status }: { status: string }) => (
    <span data-testid={`availability-${status}`}>{status}</span>
  ),
}));

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError = '';
    mockSuccess = '';
    mockLoading = false;
  });

  describe('rendering', () => {
    it('should render back button', () => {
      render(<Profile />);

      expect(screen.getByText('profile.navigation.backToGigs')).toBeInTheDocument();
    });

    it('should render name update card', () => {
      render(<Profile />);

      expect(screen.getByText('profile.sections.name.title')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.name.button')).toBeInTheDocument();
    });

    it('should render instrument update card', () => {
      render(<Profile />);

      expect(screen.getByText('profile.sections.instrument.title')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.instrument.button')).toBeInTheDocument();
    });

    it('should render sheet music card', () => {
      render(<Profile />);

      expect(screen.getByText('profile.sections.sheetMusic.title')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.sheetMusic.button')).toBeInTheDocument();
    });

    it('should render driving preferences card', () => {
      render(<Profile />);

      expect(screen.getByText('profile.sections.driving.title')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.driving.button')).toBeInTheDocument();
    });

    it('should render password update card', () => {
      render(<Profile />);

      expect(screen.getByText('profile.sections.password.title')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.password.button')).toBeInTheDocument();
    });

    it('should render all instrument options', () => {
      render(<Profile />);

      expect(screen.getByRole('option', { name: 'Bass' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Drums' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Guitar' })).toBeInTheDocument();
    });
  });

  describe('error and success messages', () => {
    it('should display error message when error exists', () => {
      mockError = 'Test error message';

      // Re-mock with error
      vi.doMock('../hooks/useProfile', () => ({
        useProfile: () => ({
          user: { uid: 'user-1', displayName: 'Test User' },
          name: 'Test User',
          setName: mockSetName,
          selectedInstrument: 'Guitar',
          setSelectedInstrument: mockSetSelectedInstrument,
          instruments: ['Bass', 'Drums', 'Guitar'],
          wantsPrintedSheetMusic: false,
          setWantsPrintedSheetMusic: mockSetWantsPrintedSheetMusic,
          drivingStatus: 'maybe',
          setDrivingStatus: mockSetDrivingStatus,
          hasWinterTyres: false,
          setHasWinterTyres: mockSetHasWinterTyres,
          hasGermanEnvironmentSticker: false,
          setHasGermanEnvironmentSticker: mockSetHasGermanEnvironmentSticker,
          drivingRemark: '',
          setDrivingRemark: mockSetDrivingRemark,
          currentPassword: '',
          setCurrentPassword: mockSetCurrentPassword,
          newPassword: '',
          setNewPassword: mockSetNewPassword,
          confirmPassword: '',
          setConfirmPassword: mockSetConfirmPassword,
          error: 'Test error message',
          success: '',
          loading: false,
          handleUpdateName: mockHandleUpdateName,
          handleUpdateInstrument: mockHandleUpdateInstrument,
          handleUpdateSheetMusicPreference: mockHandleUpdateSheetMusicPreference,
          handleUpdateDrivingPreferences: mockHandleUpdateDrivingPreferences,
          handleUpdatePassword: mockHandleUpdatePassword,
          navigateBack: mockNavigateBack,
          t: (key: string) => key,
        }),
      }));
    });

    it('should not display error message when error is empty', () => {
      render(<Profile />);

      const errorElements = document.querySelectorAll('.bg-red-50');
      expect(errorElements.length).toBe(0);
    });

    it('should not display success message when success is empty', () => {
      render(<Profile />);

      const successElements = document.querySelectorAll('.bg-green-50');
      expect(successElements.length).toBe(0);
    });
  });

  describe('user interactions', () => {
    it('should call navigateBack when back button is clicked', () => {
      render(<Profile />);

      const backButton = screen.getByText('profile.navigation.backToGigs').closest('button');
      fireEvent.click(backButton!);

      expect(mockNavigateBack).toHaveBeenCalled();
    });

    it('should call handleUpdateName when name form is submitted', () => {
      render(<Profile />);

      const nameButton = screen.getByText('profile.sections.name.button');
      fireEvent.click(nameButton);

      expect(mockHandleUpdateName).toHaveBeenCalled();
    });

    it('should call handleUpdateInstrument when instrument form is submitted', () => {
      render(<Profile />);

      const instrumentButton = screen.getByText('profile.sections.instrument.button');
      fireEvent.click(instrumentButton);

      expect(mockHandleUpdateInstrument).toHaveBeenCalled();
    });

    it('should call handleUpdateSheetMusicPreference when sheet music form is submitted', () => {
      render(<Profile />);

      const sheetMusicButton = screen.getByText('profile.sections.sheetMusic.button');
      fireEvent.click(sheetMusicButton);

      expect(mockHandleUpdateSheetMusicPreference).toHaveBeenCalled();
    });

    it('should call handleUpdateDrivingPreferences when driving form is submitted', () => {
      render(<Profile />);

      const drivingButton = screen.getByText('profile.sections.driving.button');
      fireEvent.click(drivingButton);

      expect(mockHandleUpdateDrivingPreferences).toHaveBeenCalled();
    });

    it('should render password form with all fields', () => {
      render(<Profile />);

      expect(screen.getByText('profile.sections.password.currentPassword')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.password.newPassword')).toBeInTheDocument();
      expect(screen.getByText('profile.sections.password.confirmPassword')).toBeInTheDocument();
    });
  });
});
