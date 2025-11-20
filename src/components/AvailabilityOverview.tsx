import { AvailabilityStatus } from './AvailabilityStatus';
import { Gig } from '../types';
import { useBand } from '../context/BandContext';
import { getCombinedStatus, calculateInstrumentStats } from '../utils/availabilityHelpers';

interface AvailabilityOverviewProps {
  memberAvailability: Gig['memberAvailability'];
  compact?: boolean;
}

export function AvailabilityOverview({ memberAvailability, compact = false }: AvailabilityOverviewProps) {
  const { bandMembers } = useBand();

  const instrumentAvailability = calculateInstrumentStats(memberAvailability, bandMembers);

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