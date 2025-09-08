import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../test/test-utils';
import { GigCard } from './GigCard';
import { Gig } from '../types';

// Mock all the dependencies
vi.mock('./AvailabilityOverview', () => ({
  AvailabilityOverview: () => <div data-testid="availability-overview">Overview</div>,
}));

vi.mock('./AvailabilityStatus', () => ({
  AvailabilityStatus: ({ status }: { status: string }) => (
    <div data-testid="availability-status">{status}</div>
  ),
}));

vi.mock('./AddToCalendar', () => ({
  AddToCalendar: () => <div data-testid="add-to-calendar">Add to Calendar</div>,
}));

vi.mock('../data', () => ({
  useStatusOptions: () => [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  ],
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe('GigCard', () => {
  const mockUser = { uid: 'user123' };
  
  const createMockGig = (overrides: Partial<Gig> = {}): Gig => ({
    id: 'gig1',
    name: 'Test Concert',
    date: '2024-06-15',
    startTime: '20:00',
    endTime: '23:00',
    status: { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
    isWholeDay: false,
    isMultiDay: false,
    dates: ['2024-06-15'],
    location: 'Test Venue',
    distance: 25,
    pay: 150,
    description: 'Test description',
    memberAvailability: {
      user123: { status: 'available', canDrive: true, dateAvailability: {} },
    },
    createdBy: 'creator123',
    ...overrides,
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-01'));
    
    const { useAuth } = await import('../context/AuthContext');
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render gig name', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('Test Concert')).toBeInTheDocument();
  });

  it('should render gig date', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('6/15/2024')).toBeInTheDocument();
  });

  it('should render gig time when not whole day', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('20:00 - 23:00')).toBeInTheDocument();
  });

  it('should render all day text for whole day gigs', () => {
    const gig = createMockGig({
      isWholeDay: true,
      startTime: null,
      endTime: null,
    });
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('gig.time.allDay')).toBeInTheDocument();
  });

  it('should render location with distance', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('Test Venue (25 km)')).toBeInTheDocument();
  });

  it('should render pay amount', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('150,-')).toBeInTheDocument();
  });

  it('should render status badge', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('should render availability overview', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByTestId('availability-overview')).toBeInTheDocument();
  });

  it('should show user availability status', () => {
    const gig = createMockGig();
    render(<GigCard gig={gig} />);
    
    expect(screen.getByTestId('availability-status')).toBeInTheDocument();
    expect(screen.getByText('available')).toBeInTheDocument();
  });

  it('should handle missing optional fields', () => {
    const gig = createMockGig({
      location: null,
      distance: null,
      pay: null,
    });
    render(<GigCard gig={gig} />);
    
    expect(screen.getByText('Test Concert')).toBeInTheDocument();
    expect(screen.queryByText('Test Venue')).not.toBeInTheDocument();
    expect(screen.queryByText('150,-')).not.toBeInTheDocument();
  });
});