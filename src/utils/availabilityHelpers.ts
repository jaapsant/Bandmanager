import { Gig, AvailabilityStatusValue } from '../types';

export interface InstrumentStats {
    total: number;
    available: number;
    tentative: number;
}

/**
 * Calculate combined availability status based on instrument stats
 */
export function getCombinedStatus(stats: InstrumentStats): AvailabilityStatusValue {
    const availablePercentage = (stats.available / stats.total) * 100;
    const tentativePercentage = (stats.tentative / stats.total) * 100;

    if (availablePercentage > 50) {
        return 'available';
    } else if (availablePercentage + tentativePercentage > 30) {
        return 'maybe';
    }
    return 'unavailable';
}

/**
 * Calculate availability stats per instrument
 */
export function calculateInstrumentStats(
    memberAvailability: Gig['memberAvailability'],
    bandMembers: Array<{ id: string; instrument: string }>
): Record<string, InstrumentStats> {
    return bandMembers.reduce<Record<string, InstrumentStats>>((acc, member) => {
        const availability = memberAvailability[member.id];
        if (!acc[member.instrument]) {
            acc[member.instrument] = {
                total: 0,
                available: 0,
                tentative: 0,
            };
        }

        acc[member.instrument].total++;
        if (availability?.status === 'available') {
            acc[member.instrument].available++;
        } else if (availability?.status === 'maybe') {
            acc[member.instrument].tentative++;
        }

        return acc;
    }, {});
}

/**
 * Count total available drivers for a gig
 */
export function countAvailableDrivers(memberAvailability: Gig['memberAvailability']): number {
    return Object.values(memberAvailability).reduce((count, availability) => {
        if (availability.status === 'available' && availability.canDrive) {
            return count + 1;
        }
        return count;
    }, 0);
}
