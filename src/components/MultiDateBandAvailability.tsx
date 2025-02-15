import { Gig } from '../types';
import { Car } from 'lucide-react';
import { AvailabilityStatus } from './AvailabilityStatus';
import { useRole } from '../hooks/useRole';
import { useBand } from '../context/BandContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface MultiDateBandAvailabilityProps {
  gig: Gig;
  onUpdateMemberAvailability?: (memberId: string, date: string, status: 'available' | 'unavailable' | 'maybe') => Promise<void>;
  onUpdateMemberDriving?: (memberId: string, date: string, canDrive: boolean) => Promise<void>;
}

export function MultiDateBandAvailability({ gig, onUpdateMemberAvailability, onUpdateMemberDriving }: MultiDateBandAvailabilityProps) {
  const { t } = useTranslation();
  const { bandMembers } = useBand();
  const { roles } = useRole();
  const { user } = useAuth();
  const canEditGig = user?.emailVerified && (roles.admin || roles.bandManager);
  const isPastGig = new Date(gig.date) < new Date();
  const allDates = [gig.date, ...gig.dates];

  // Group band members by instrument
  const membersByInstrument = bandMembers.reduce<Record<string, typeof bandMembers>>((acc, member) => {
    if (!acc[member.instrument]) {
      acc[member.instrument] = [];
    }
    acc[member.instrument].push(member);
    return acc;
  }, {});

  const sortedInstruments = Object.keys(membersByInstrument).sort();
  sortedInstruments.forEach(instrument => {
    membersByInstrument[instrument].sort((a, b) => a.name.localeCompare(b.name));
  });

  const getMemberAvailability = (memberId: string, date: string) => {
    return gig.memberAvailability[memberId]?.dateAvailability?.[date];
  };

  return (
    <div className="space-y-6">
      {sortedInstruments.map((instrument) => (
        <div key={instrument} className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">{instrument}</h4>
          <div className="space-y-4">
            {membersByInstrument[instrument].map((member) => (
              <div key={member.id} className="space-y-2">
                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                <div className="grid grid-cols-1 gap-2">
                  {allDates.map((date) => {
                    const availability = getMemberAvailability(member.id, date);
                    return (
                      <div key={date} className="space-y-2">
                        <div className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm text-gray-500">
                            {new Date(date).toLocaleDateString()}
                          </span>
                          <div className="flex items-center space-x-2">
                            {(canEditGig && isPastGig && onUpdateMemberAvailability) ? (
                              <>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => onUpdateMemberAvailability(member.id, date, 'available')}
                                    className={`p-1 rounded-full hover:bg-green-100 ${
                                      availability?.status === 'available' ? 'bg-green-100' : ''
                                    }`}
                                  >
                                    <AvailabilityStatus status="available" size="sm" />
                                  </button>
                                  <button
                                    onClick={() => onUpdateMemberAvailability(member.id, date, 'unavailable')}
                                    className={`p-1 rounded-full hover:bg-red-100 ${
                                      availability?.status === 'unavailable' ? 'bg-red-100' : ''
                                    }`}
                                  >
                                    <AvailabilityStatus status="unavailable" size="sm" />
                                  </button>
                                  <button
                                    onClick={() => onUpdateMemberAvailability(member.id, date, 'maybe')}
                                    className={`p-1 rounded-full hover:bg-yellow-100 ${
                                      availability?.status === 'maybe' ? 'bg-yellow-100' : ''
                                    }`}
                                  >
                                    <AvailabilityStatus status="maybe" size="sm" />
                                  </button>
                                </div>
                                {availability?.status === 'available' && onUpdateMemberDriving && (
                                  <button
                                    onClick={() => onUpdateMemberDriving(member.id, date, !availability.canDrive)}
                                    className={`p-1 rounded-full hover:bg-blue-100 ${
                                      availability.canDrive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                                    }`}
                                  >
                                    <Car className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <>
                                <AvailabilityStatus status={availability?.status} size="sm" />
                                {availability?.status === 'available' && availability.canDrive && (
                                  <Car className="w-4 h-4 text-blue-600" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        {availability?.note && (
                          <p className="text-sm text-gray-500 italic ml-4 bg-white p-2 rounded">
                            {availability.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {gig.memberAvailability[member.id]?.note && (
                    <p className="text-sm text-gray-500 italic ml-4">
                      {gig.memberAvailability[member.id].note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 