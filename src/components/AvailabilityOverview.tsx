import { AvailabilityStatus } from './AvailabilityStatus';
import { Gig } from '../types';
import { useBand } from '../context/BandContext';

interface AvailabilityOverviewProps {
  memberAvailability: Gig['memberAvailability'];
  compact?: boolean;
}

export function AvailabilityOverview({ memberAvailability, compact = false }: AvailabilityOverviewProps) {
  const { bandMembers } = useBand();
  
  // Count total drivers who are available
  const totalDrivers = Object.entries(memberAvailability).reduce((count, [memberId, availability]) => {
    if (availability.status === 'available' && availability.canDrive) {
      return count + 1;
    }
    return count;
  }, 0);

  const instrumentAvailability = bandMembers.reduce<Record<string, { total: number; available: number; tentative: number }>>((acc, member) => {
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

  const getCombinedStatus = (stats: { total: number; available: number; tentative: number }): 'available' | 'unavailable' | 'maybe' => {
    const availablePercentage = (stats.available / stats.total) * 100;
    const tentativePercentage = (stats.tentative / stats.total) * 100;
    
    if (availablePercentage > 50) {
      return 'available';
    } else if (availablePercentage + tentativePercentage > 30) {
      return 'maybe';
    }
    return 'unavailable';
  };

  // Sort instruments alphabetically
  const sortedInstruments = Object.keys(instrumentAvailability).sort((a, b) => a.localeCompare(b));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {sortedInstruments.map((instrument) => {
          const stats = instrumentAvailability[instrument];
          return (
            <div key={instrument} className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded">
              <span className="text-gray-700 mr-1">
                {instrument}:
              </span>
              <AvailabilityStatus status={getCombinedStatus(stats)} size="sm" />
              <span className="ml-1 text-gray-500">
                {stats.available}/{stats.total}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedInstruments.map((instrument) => {
        const stats = instrumentAvailability[instrument];
        return (
          <div key={instrument} className="flex items-center justify-between text-sm">
            <span className="w-20 text-gray-500">{instrument}:</span>
            <div className="flex items-center">
              <AvailabilityStatus status={getCombinedStatus(stats)} size="sm" />
              <span className="ml-2 text-xs text-gray-500">
                ({stats.available}/{stats.total})
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}