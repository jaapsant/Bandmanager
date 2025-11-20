import { useMemo } from 'react';
import { Gig, BandMember } from '../types';
import { countAvailableDrivers } from '../utils/availabilityHelpers';

export interface GigStats {
    totalDrivers: number;
    membersByInstrument: Record<string, BandMember[]>;
    sortedInstruments: string[];
}

/**
 * Custom hook to calculate gig statistics
 * Memoized to prevent unnecessary recalculations
 */
export function useGigStats(gig: Gig, bandMembers: BandMember[]): GigStats {
    const totalDrivers = useMemo(
        () => countAvailableDrivers(gig.memberAvailability),
        [gig.memberAvailability]
    );

    const membersByInstrument = useMemo(() => {
        return bandMembers.reduce<Record<string, BandMember[]>>((acc, member) => {
            if (!acc[member.instrument]) {
                acc[member.instrument] = [];
            }
            acc[member.instrument].push(member);
            return acc;
        }, {});
    }, [bandMembers]);

    const sortedInstruments = useMemo(() => {
        const instruments = Object.keys(membersByInstrument).sort();
        // Sort members within each instrument group
        instruments.forEach(instrument => {
            membersByInstrument[instrument].sort((a, b) => a.name.localeCompare(b.name));
        });
        return instruments;
    }, [membersByInstrument]);

    return {
        totalDrivers,
        membersByInstrument,
        sortedInstruments,
    };
}
