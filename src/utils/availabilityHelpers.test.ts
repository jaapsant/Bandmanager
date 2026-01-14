import { describe, it, expect } from 'vitest';
import {
  getCombinedStatus,
  calculateInstrumentStats,
  countAvailableDrivers,
  getMemberAvailability,
  calculateDominantStatus,
  updateMemberAvailabilityInGig,
  updateDrivingStatusInGig,
  toggleMemberDrivingInGig,
  InstrumentStats
} from './availabilityHelpers';
import { Gig, MemberAvailability, AvailabilityStatusValue } from '../types';

// Helper to create a mock gig
const createMockGig = (overrides: Partial<Gig> = {}): Gig => ({
  id: 'gig-1',
  name: 'Test Gig',
  date: '2024-03-15',
  startTime: '19:00',
  endTime: '22:00',
  status: 'confirmed',
  isWholeDay: false,
  isMultiDay: false,
  dates: [],
  location: 'Test Venue',
  distance: 10,
  pay: 500,
  description: 'Test description',
  memberAvailability: {},
  createdBy: 'user-123',
  ...overrides
});

// Helper to create mock member availability
const createMockAvailability = (overrides: Partial<MemberAvailability> = {}): MemberAvailability => ({
  status: 'maybe',
  note: '',
  canDrive: false,
  dateAvailability: {},
  ...overrides
});

describe('availabilityHelpers', () => {
  describe('getCombinedStatus', () => {
    it('should return available when more than 50% are available', () => {
      const stats: InstrumentStats = { total: 4, available: 3, tentative: 1 };
      expect(getCombinedStatus(stats)).toBe('available');
    });

    it('should return maybe when available + tentative > 30% but available <= 50%', () => {
      const stats: InstrumentStats = { total: 10, available: 3, tentative: 2 };
      expect(getCombinedStatus(stats)).toBe('maybe');
    });

    it('should return unavailable when available + tentative <= 30%', () => {
      const stats: InstrumentStats = { total: 10, available: 1, tentative: 1 };
      expect(getCombinedStatus(stats)).toBe('unavailable');
    });
  });

  describe('calculateInstrumentStats', () => {
    it('should calculate stats per instrument', () => {
      const memberAvailability = {
        'user-1': createMockAvailability({ status: 'available' }),
        'user-2': createMockAvailability({ status: 'maybe' }),
        'user-3': createMockAvailability({ status: 'unavailable' }),
      };
      const bandMembers = [
        { id: 'user-1', instrument: 'Guitar' },
        { id: 'user-2', instrument: 'Guitar' },
        { id: 'user-3', instrument: 'Drums' },
      ];

      const result = calculateInstrumentStats(memberAvailability, bandMembers);

      expect(result.Guitar).toEqual({ total: 2, available: 1, tentative: 1 });
      expect(result.Drums).toEqual({ total: 1, available: 0, tentative: 0 });
    });

    it('should handle members without availability', () => {
      const memberAvailability = {};
      const bandMembers = [{ id: 'user-1', instrument: 'Guitar' }];

      const result = calculateInstrumentStats(memberAvailability, bandMembers);

      expect(result.Guitar).toEqual({ total: 1, available: 0, tentative: 0 });
    });
  });

  describe('countAvailableDrivers', () => {
    it('should count only available members who can drive', () => {
      const memberAvailability = {
        'user-1': createMockAvailability({ status: 'available', canDrive: true }),
        'user-2': createMockAvailability({ status: 'available', canDrive: false }),
        'user-3': createMockAvailability({ status: 'maybe', canDrive: true }),
        'user-4': createMockAvailability({ status: 'unavailable', canDrive: true }),
      };

      expect(countAvailableDrivers(memberAvailability)).toBe(1);
    });

    it('should return 0 when no available drivers', () => {
      const memberAvailability = {
        'user-1': createMockAvailability({ status: 'maybe', canDrive: true }),
      };

      expect(countAvailableDrivers(memberAvailability)).toBe(0);
    });
  });

  describe('getMemberAvailability', () => {
    it('should return member availability when it exists', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability({ status: 'available', canDrive: true })
        }
      });

      const result = getMemberAvailability(gig, 'user-1');

      expect(result.status).toBe('available');
      expect(result.canDrive).toBe(true);
    });

    it('should return default availability when member has none', () => {
      const gig = createMockGig();

      const result = getMemberAvailability(gig, 'user-1');

      expect(result.status).toBe('maybe');
      expect(result.canDrive).toBe(false);
      expect(result.note).toBe('');
    });
  });

  describe('calculateDominantStatus', () => {
    it('should return the most common status', () => {
      expect(calculateDominantStatus(['available', 'available', 'maybe'])).toBe('available');
      expect(calculateDominantStatus(['unavailable', 'unavailable', 'maybe'])).toBe('unavailable');
      expect(calculateDominantStatus(['maybe', 'maybe', 'available'])).toBe('maybe');
    });

    it('should return maybe for empty array', () => {
      expect(calculateDominantStatus([])).toBe('maybe');
    });

    it('should prefer unavailable in case of tie (conservative approach)', () => {
      expect(calculateDominantStatus(['available', 'unavailable'])).toBe('unavailable');
      expect(calculateDominantStatus(['available', 'maybe', 'unavailable'])).toBe('unavailable');
    });

    it('should prefer maybe over available in case of tie', () => {
      expect(calculateDominantStatus(['available', 'maybe'])).toBe('maybe');
    });
  });

  describe('updateMemberAvailabilityInGig', () => {
    it('should update status for single-day gig', () => {
      const gig = createMockGig();

      const result = updateMemberAvailabilityInGig(gig, 'user-1', { status: 'available' });

      expect(result.memberAvailability['user-1'].status).toBe('available');
    });

    it('should update note for single-day gig', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability({ status: 'available' })
        }
      });

      const result = updateMemberAvailabilityInGig(gig, 'user-1', { note: 'Test note' });

      expect(result.memberAvailability['user-1'].note).toBe('Test note');
      expect(result.memberAvailability['user-1'].status).toBe('available');
    });

    it('should update canDrive for single-day gig', () => {
      const gig = createMockGig();

      const result = updateMemberAvailabilityInGig(gig, 'user-1', { canDrive: true });

      expect(result.memberAvailability['user-1'].canDrive).toBe(true);
    });

    it('should update specific date for multi-day gig', () => {
      const gig = createMockGig({
        isMultiDay: true,
        date: '2024-03-15',
        dates: ['2024-03-16', '2024-03-17']
      });

      const result = updateMemberAvailabilityInGig(
        gig,
        'user-1',
        { status: 'available' },
        '2024-03-16'
      );

      expect(result.memberAvailability['user-1'].dateAvailability['2024-03-16'].status).toBe('available');
      // Other dates should be initialized with default 'maybe'
      expect(result.memberAvailability['user-1'].dateAvailability['2024-03-15'].status).toBe('maybe');
      expect(result.memberAvailability['user-1'].dateAvailability['2024-03-17'].status).toBe('maybe');
    });

    it('should recalculate overall status for multi-day gig', () => {
      const gig = createMockGig({
        isMultiDay: true,
        date: '2024-03-15',
        dates: ['2024-03-16'],
        memberAvailability: {
          'user-1': createMockAvailability({
            dateAvailability: {
              '2024-03-15': { status: 'available', note: '', canDrive: false }
            }
          })
        }
      });

      // Update second date to available
      const result = updateMemberAvailabilityInGig(
        gig,
        'user-1',
        { status: 'available' },
        '2024-03-16'
      );

      // Overall status should be 'available' (both dates are available)
      expect(result.memberAvailability['user-1'].status).toBe('available');
    });

    it('should preserve existing availability when updating other members', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability({ status: 'available' }),
          'user-2': createMockAvailability({ status: 'unavailable' })
        }
      });

      const result = updateMemberAvailabilityInGig(gig, 'user-1', { status: 'maybe' });

      expect(result.memberAvailability['user-1'].status).toBe('maybe');
      expect(result.memberAvailability['user-2'].status).toBe('unavailable');
    });
  });

  describe('updateDrivingStatusInGig', () => {
    it('should update driving status for specific date', () => {
      const gig = createMockGig({
        isMultiDay: true,
        memberAvailability: {
          'user-1': createMockAvailability({
            dateAvailability: {
              '2024-03-15': { status: 'available', note: '', canDrive: false }
            }
          })
        }
      });

      const result = updateDrivingStatusInGig(gig, 'user-1', '2024-03-15', true);

      expect(result).not.toBeNull();
      expect(result!.memberAvailability['user-1'].dateAvailability['2024-03-15'].canDrive).toBe(true);
    });

    it('should return null if date availability does not exist', () => {
      const gig = createMockGig();

      const result = updateDrivingStatusInGig(gig, 'user-1', '2024-03-15', true);

      expect(result).toBeNull();
    });

    it('should return null if member has no availability', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability()
        }
      });

      const result = updateDrivingStatusInGig(gig, 'user-1', '2024-03-15', true);

      expect(result).toBeNull();
    });
  });

  describe('toggleMemberDrivingInGig', () => {
    it('should toggle driving from false to true', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability({ canDrive: false })
        }
      });

      const result = toggleMemberDrivingInGig(gig, 'user-1');

      expect(result.memberAvailability['user-1'].canDrive).toBe(true);
    });

    it('should toggle driving from true to false', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability({ canDrive: true })
        }
      });

      const result = toggleMemberDrivingInGig(gig, 'user-1');

      expect(result.memberAvailability['user-1'].canDrive).toBe(false);
    });

    it('should preserve other availability fields when toggling', () => {
      const gig = createMockGig({
        memberAvailability: {
          'user-1': createMockAvailability({
            status: 'available',
            note: 'Important note',
            canDrive: false
          })
        }
      });

      const result = toggleMemberDrivingInGig(gig, 'user-1');

      expect(result.memberAvailability['user-1'].status).toBe('available');
      expect(result.memberAvailability['user-1'].note).toBe('Important note');
      expect(result.memberAvailability['user-1'].canDrive).toBe(true);
    });

    it('should create default availability if member has none', () => {
      const gig = createMockGig();

      const result = toggleMemberDrivingInGig(gig, 'user-1');

      expect(result.memberAvailability['user-1'].status).toBe('maybe');
      expect(result.memberAvailability['user-1'].canDrive).toBe(true);
    });
  });
});
