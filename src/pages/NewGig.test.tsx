import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewGig } from './NewGig';

// Mock handlers
const mockHandleSubmit = vi.fn();
const mockHandleNameChange = vi.fn();
const mockHandleMultiDayChange = vi.fn();
const mockHandleLocationChange = vi.fn();
const mockHandleDistanceChange = vi.fn();
const mockHandleDateChange = vi.fn();
const mockHandleWholeDayChange = vi.fn();
const mockHandleStartTimeChange = vi.fn();
const mockHandleEndTimeChange = vi.fn();
const mockHandlePayChange = vi.fn();
const mockHandleDescriptionChange = vi.fn();
const mockHandleAddDate = vi.fn();
const mockHandleRemoveDate = vi.fn();
const mockHandleDateAtIndexChange = vi.fn();
const mockNavigateBack = vi.fn();
const mockSetSendEmailNotification = vi.fn();

let mockError = '';
let mockIsSubmitting = false;

vi.mock('../hooks/useNewGig', () => ({
  useNewGig: () => ({
    formData: {
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
      pay: null,
      description: '',
    },
    sendEmailNotification: true,
    setSendEmailNotification: mockSetSendEmailNotification,
    error: mockError,
    isSubmitting: mockIsSubmitting,
    today: '2026-01-15',
    handleSubmit: mockHandleSubmit,
    handleNameChange: mockHandleNameChange,
    handleMultiDayChange: mockHandleMultiDayChange,
    handleLocationChange: mockHandleLocationChange,
    handleDistanceChange: mockHandleDistanceChange,
    handleDateChange: mockHandleDateChange,
    handleWholeDayChange: mockHandleWholeDayChange,
    handleStartTimeChange: mockHandleStartTimeChange,
    handleEndTimeChange: mockHandleEndTimeChange,
    handlePayChange: mockHandlePayChange,
    handleDescriptionChange: mockHandleDescriptionChange,
    handleAddDate: mockHandleAddDate,
    handleRemoveDate: mockHandleRemoveDate,
    handleDateAtIndexChange: mockHandleDateAtIndexChange,
    navigateBack: mockNavigateBack,
    t: (key: string) => key,
  }),
}));

describe('NewGig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockError = '';
    mockIsSubmitting = false;
  });

  describe('rendering', () => {
    it('should render back button', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.navigation.backToGigs')).toBeInTheDocument();
    });

    it('should render page title', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.title')).toBeInTheDocument();
    });

    it('should render name field', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.name.label')).toBeInTheDocument();
    });

    it('should render multi-day checkbox', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.multiDay.label')).toBeInTheDocument();
      expect(screen.getByText('newGig.form.multiDay.checkbox')).toBeInTheDocument();
    });

    it('should render location field', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.location.label')).toBeInTheDocument();
    });

    it('should render distance field', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.distance.label')).toBeInTheDocument();
    });

    it('should render date field', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.date.label')).toBeInTheDocument();
    });

    it('should render whole day checkbox', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.wholeDay.label')).toBeInTheDocument();
    });

    it('should render time fields', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.time.start')).toBeInTheDocument();
      expect(screen.getByText('newGig.form.time.end')).toBeInTheDocument();
    });

    it('should render pay field', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.pay.label')).toBeInTheDocument();
    });

    it('should render description field', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.description.label')).toBeInTheDocument();
    });

    it('should render email notification checkbox', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.emailNotification.checkbox')).toBeInTheDocument();
    });

    it('should render cancel and create buttons', () => {
      render(<NewGig />);

      expect(screen.getByText('newGig.form.buttons.cancel')).toBeInTheDocument();
      expect(screen.getByText('newGig.form.buttons.create')).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('should not display error when error is empty', () => {
      render(<NewGig />);

      const errorElements = document.querySelectorAll('.bg-red-50');
      expect(errorElements.length).toBe(0);
    });
  });

  describe('user interactions', () => {
    it('should call navigateBack when back button is clicked', () => {
      render(<NewGig />);

      const backButton = screen.getByText('newGig.navigation.backToGigs').closest('button');
      fireEvent.click(backButton!);

      expect(mockNavigateBack).toHaveBeenCalled();
    });

    it('should call navigateBack when cancel button is clicked', () => {
      render(<NewGig />);

      const cancelButton = screen.getByText('newGig.form.buttons.cancel');
      fireEvent.click(cancelButton);

      expect(mockNavigateBack).toHaveBeenCalled();
    });

    it('should render create button with correct text', () => {
      render(<NewGig />);

      const createButton = screen.getByText('newGig.form.buttons.create');
      expect(createButton).toBeInTheDocument();
      expect(createButton).not.toBeDisabled();
    });
  });
});
