import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/test-utils';
import { AvailabilityOverview } from './AvailabilityOverview';

// Mock the AvailabilityStatus component
vi.mock('./AvailabilityStatus', () => ({
  AvailabilityStatus: ({ status, size }: { status: string; size?: string }) => (
    <div data-testid="availability-status" data-status={status} data-size={size}>
      {status}
    </div>
  ),
}));

// Mock the BandContext
vi.mock('../context/BandContext', () => ({
  useBand: vi.fn(),
}));

describe('AvailabilityOverview', () => {
  const mockBandMembers = [
    { id: 'member1', name: 'John', instrument: 'Guitar' },
    { id: 'member2', name: 'Jane', instrument: 'Bass' },
    { id: 'member3', name: 'Bob', instrument: 'Drums' },
    { id: 'member4', name: 'Alice', instrument: 'Guitar' }, // Second guitarist
  ];

  beforeEach(async () => {
    const { useBand } = await import('../context/BandContext');
    vi.mocked(useBand).mockReturnValue({ bandMembers: mockBandMembers });
  });

  it('should render instrument availability in compact mode', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
      member2: { status: 'unavailable', canDrive: false, dateAvailability: {} },
      member3: { status: 'maybe', canDrive: true, dateAvailability: {} },
      member4: { status: 'available', canDrive: false, dateAvailability: {} },
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    // Should show instruments sorted alphabetically
    expect(screen.getByText('Bass:')).toBeInTheDocument();
    expect(screen.getByText('Drums:')).toBeInTheDocument();
    expect(screen.getByText('Guitar:')).toBeInTheDocument();

    // Should show availability counts
    expect(screen.getAllByText('0/1')).toHaveLength(2); // Bass and Drums: both 0/1
    expect(screen.getByText('2/2')).toBeInTheDocument(); // Guitar: 2 available out of 2
  });

  it('should render instrument availability in full mode', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
      member2: { status: 'unavailable', canDrive: false, dateAvailability: {} },
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact={false} />);

    // Should show instruments with full layout
    expect(screen.getByText('Bass:')).toBeInTheDocument();
    expect(screen.getByText('Guitar:')).toBeInTheDocument();

    // Should show availability counts in parentheses
    expect(screen.getAllByText('(0/1)')).toHaveLength(2); // Bass and Drums: both (0/1)
    expect(screen.getByText('(1/2)')).toBeInTheDocument(); // Guitar: (1/2) since member4 has no availability
  });

  it('should calculate availability status correctly for instruments', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} }, // Guitar
      member4: { status: 'available', canDrive: false, dateAvailability: {} }, // Guitar
      member2: { status: 'unavailable', canDrive: false, dateAvailability: {} }, // Bass
      member3: { status: 'maybe', canDrive: true, dateAvailability: {} }, // Drums
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    const statusElements = screen.getAllByTestId('availability-status');
    
    // Should have status for each instrument (Bass, Drums, Guitar)
    expect(statusElements).toHaveLength(3);

    // Check individual statuses
    const bassStatus = statusElements.find(el => el.getAttribute('data-status') === 'unavailable');
    const drumsStatus = statusElements.find(el => el.getAttribute('data-status') === 'maybe');
    const guitarStatus = statusElements.find(el => el.getAttribute('data-status') === 'available');

    expect(bassStatus).toBeInTheDocument();
    expect(drumsStatus).toBeInTheDocument(); 
    expect(guitarStatus).toBeInTheDocument();
  });

  it('should use small size for availability status icons', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    const statusElements = screen.getAllByTestId('availability-status');
    statusElements.forEach(element => {
      expect(element).toHaveAttribute('data-size', 'sm');
    });
  });

  it('should sort instruments alphabetically', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} }, // Guitar
      member2: { status: 'available', canDrive: false, dateAvailability: {} }, // Bass  
      member3: { status: 'available', canDrive: true, dateAvailability: {} }, // Drums
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    // Check that instruments appear in alphabetical order
    const instrumentContainer = screen.getByText('Bass:').closest('.flex');
    const drumsContainer = screen.getByText('Drums:').closest('.flex'); 
    const guitarContainer = screen.getByText('Guitar:').closest('.flex');
    
    expect(instrumentContainer).toBeInTheDocument();
    expect(drumsContainer).toBeInTheDocument();
    expect(guitarContainer).toBeInTheDocument();
  });

  it('should handle members without availability data', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
      // member2, member3, member4 have no availability data
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    // Should still show all instruments, but with correct counts
    expect(screen.getByText('Bass:')).toBeInTheDocument();
    expect(screen.getByText('Drums:')).toBeInTheDocument(); 
    expect(screen.getByText('Guitar:')).toBeInTheDocument();

    expect(screen.getAllByText('0/1')).toHaveLength(2); // Bass and Drums: both 0/1
    expect(screen.getByText('1/2')).toBeInTheDocument(); // Guitar: 1/2 (member1 available, member4 no data = unavailable)
  });

  it('should calculate combined status based on percentage thresholds', () => {
    // Test different scenarios for combined status calculation
    const memberAvailability = {
      // Guitar: 2/2 available (100% > 50%) -> 'available'
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
      member4: { status: 'available', canDrive: false, dateAvailability: {} },
      // Bass: 0/1 available (0% <= 50%, 0% + 0% <= 30%) -> 'unavailable' 
      member2: { status: 'unavailable', canDrive: false, dateAvailability: {} },
      // Drums: 0/1 available but 1/1 maybe (0% + 100% > 30%) -> 'maybe'
      member3: { status: 'maybe', canDrive: true, dateAvailability: {} },
    };

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    const statusElements = screen.getAllByTestId('availability-status');
    const statuses = statusElements.map(el => el.getAttribute('data-status'));

    expect(statuses).toContain('available'); // Guitar
    expect(statuses).toContain('unavailable'); // Bass
    expect(statuses).toContain('maybe'); // Drums
  });

  it('should render compact layout with correct CSS classes', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
    };

    const { container } = render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);
    
    const mainContainer = container.querySelector('.flex.flex-wrap.gap-2');
    expect(mainContainer).toBeInTheDocument();

    const instrumentContainer = container.querySelector('.flex.items-center.text-xs.bg-gray-50.px-2.py-1.rounded');
    expect(instrumentContainer).toBeInTheDocument();
  });

  it('should render full layout with correct CSS classes', () => {
    const memberAvailability = {
      member1: { status: 'available', canDrive: true, dateAvailability: {} },
    };

    const { container } = render(<AvailabilityOverview memberAvailability={memberAvailability} compact={false} />);
    
    const mainContainer = container.querySelector('.space-y-2');
    expect(mainContainer).toBeInTheDocument();

    const instrumentContainer = container.querySelector('.flex.items-center.justify-between.text-sm');
    expect(instrumentContainer).toBeInTheDocument();
  });

  it('should handle empty member availability', () => {
    const memberAvailability = {};

    render(<AvailabilityOverview memberAvailability={memberAvailability} compact />);

    // Should still render all instruments from bandMembers, but with 0/total counts
    expect(screen.getByText('Bass:')).toBeInTheDocument();
    expect(screen.getByText('Drums:')).toBeInTheDocument();
    expect(screen.getByText('Guitar:')).toBeInTheDocument();

    expect(screen.getAllByText('0/1')).toHaveLength(2); // Bass and Drums: both 0/1
    expect(screen.getByText('0/2')).toBeInTheDocument(); // Guitar (2 guitarists)
  });
});