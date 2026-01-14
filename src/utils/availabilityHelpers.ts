import { Gig, MemberAvailability, AvailabilityStatusValue, DateAvailability } from '../types';

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

// ============================================================================
// Member Availability Update Helpers
// ============================================================================

/**
 * Default availability values for a member who hasn't set their availability yet.
 */
const DEFAULT_AVAILABILITY: MemberAvailability = {
    status: 'maybe',
    note: '',
    canDrive: false,
    dateAvailability: {}
};

/**
 * Default availability values for a specific date.
 */
const DEFAULT_DATE_AVAILABILITY: DateAvailability = {
    status: 'maybe',
    note: '',
    canDrive: false
};

/**
 * Gets the current availability for a member, returning defaults if not set.
 */
export function getMemberAvailability(
    gig: Gig,
    memberId: string
): MemberAvailability {
    return gig.memberAvailability[memberId] || { ...DEFAULT_AVAILABILITY };
}

/**
 * Calculates the most common status from a list of statuses.
 * Used to determine the overall status for multi-day gigs.
 *
 * In case of a tie, the priority is: unavailable > maybe > available
 * (to be conservative about availability)
 */
export function calculateDominantStatus(
    statuses: AvailabilityStatusValue[]
): AvailabilityStatusValue {
    if (statuses.length === 0) return 'maybe';

    const statusCount = statuses.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<AvailabilityStatusValue, number>);

    // Find the maximum count
    const maxCount = Math.max(...Object.values(statusCount));

    // Get all statuses with the maximum count (handles ties)
    const topStatuses = (Object.entries(statusCount) as [AvailabilityStatusValue, number][])
        .filter(([, count]) => count === maxCount)
        .map(([status]) => status);

    // If there's a tie, use priority: unavailable > maybe > available
    if (topStatuses.includes('unavailable')) return 'unavailable';
    if (topStatuses.includes('maybe')) return 'maybe';
    return 'available';
}

export interface UpdateAvailabilityOptions {
    status?: AvailabilityStatusValue;
    note?: string;
    canDrive?: boolean;
}

/**
 * Creates an updated gig object with the member's availability changed.
 * Handles both single-day and multi-day gigs.
 *
 * @param gig - The current gig object
 * @param memberId - The ID of the member to update
 * @param options - The availability fields to update
 * @param date - For multi-day gigs, the specific date to update (optional)
 * @returns Updated gig object ready to be saved
 */
export function updateMemberAvailabilityInGig(
    gig: Gig,
    memberId: string,
    options: UpdateAvailabilityOptions,
    date?: string
): Gig {
    const currentAvailability = getMemberAvailability(gig, memberId);

    if (gig.isMultiDay && date) {
        return updateMultiDayAvailability(gig, memberId, currentAvailability, options, date);
    }

    return updateSingleDayAvailability(gig, memberId, currentAvailability, options);
}

/**
 * Updates availability for a single-day gig.
 */
function updateSingleDayAvailability(
    gig: Gig,
    memberId: string,
    currentAvailability: MemberAvailability,
    options: UpdateAvailabilityOptions
): Gig {
    const updatedAvailability: MemberAvailability = {
        ...currentAvailability,
        status: options.status ?? currentAvailability.status,
        note: options.note ?? currentAvailability.note ?? '',
        canDrive: options.canDrive ?? currentAvailability.canDrive ?? false,
        dateAvailability: currentAvailability.dateAvailability || {}
    };

    return {
        ...gig,
        memberAvailability: {
            ...gig.memberAvailability,
            [memberId]: updatedAvailability
        }
    };
}

/**
 * Updates availability for a multi-day gig, including recalculating the overall status.
 */
function updateMultiDayAvailability(
    gig: Gig,
    memberId: string,
    currentAvailability: MemberAvailability,
    options: UpdateAvailabilityOptions,
    date: string
): Gig {
    const allDates = [gig.date, ...gig.dates];

    // Initialize dateAvailability with defaults for all dates
    const initializedDateAvailability: Record<string, DateAvailability> = {};
    allDates.forEach(d => {
        initializedDateAvailability[d] = currentAvailability.dateAvailability?.[d]
            || { ...DEFAULT_DATE_AVAILABILITY };
    });

    // Update the specific date
    const currentDateAvailability = initializedDateAvailability[date];
    initializedDateAvailability[date] = {
        status: options.status ?? currentDateAvailability.status,
        note: options.note ?? currentDateAvailability.note ?? '',
        canDrive: options.canDrive ?? currentDateAvailability.canDrive ?? false
    };

    // Calculate the overall status based on all dates
    const allStatuses = allDates.map(d => initializedDateAvailability[d].status);
    const dominantStatus = calculateDominantStatus(allStatuses);

    const updatedAvailability: MemberAvailability = {
        ...currentAvailability,
        status: dominantStatus,
        dateAvailability: initializedDateAvailability
    };

    return {
        ...gig,
        memberAvailability: {
            ...gig.memberAvailability,
            [memberId]: updatedAvailability
        }
    };
}

/**
 * Updates only the driving status for a member on a specific date (multi-day gig).
 * Returns null if the date availability doesn't exist yet.
 */
export function updateDrivingStatusInGig(
    gig: Gig,
    memberId: string,
    date: string,
    canDrive: boolean
): Gig | null {
    const currentAvailability = gig.memberAvailability[memberId];
    if (!currentAvailability?.dateAvailability?.[date]) {
        return null;
    }

    const updatedAvailability: MemberAvailability = {
        ...currentAvailability,
        dateAvailability: {
            ...currentAvailability.dateAvailability,
            [date]: {
                ...currentAvailability.dateAvailability[date],
                canDrive
            }
        }
    };

    return {
        ...gig,
        memberAvailability: {
            ...gig.memberAvailability,
            [memberId]: updatedAvailability
        }
    };
}

/**
 * Toggles the driving status for a member.
 * Works for single-day gigs.
 */
export function toggleMemberDrivingInGig(
    gig: Gig,
    memberId: string
): Gig {
    const currentAvailability = getMemberAvailability(gig, memberId);

    const updatedAvailability: MemberAvailability = {
        ...currentAvailability,
        status: currentAvailability.status || 'maybe',
        note: currentAvailability.note || '',
        canDrive: !currentAvailability.canDrive
    };

    return {
        ...gig,
        memberAvailability: {
            ...gig.memberAvailability,
            [memberId]: updatedAvailability
        }
    };
}
