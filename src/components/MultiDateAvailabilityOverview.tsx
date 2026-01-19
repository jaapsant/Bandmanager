import { Gig } from '../types';
import { useTranslation } from 'react-i18next';
import { Car, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useBand } from '../context/BandContext';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { formatDate } from '../utils/dateFormat';

interface MultiDateAvailabilityOverviewProps {
  gig: Gig;
  onSelectSingleDate?: (date: string) => Promise<void>;
}

export function MultiDateAvailabilityOverview({ gig, onSelectSingleDate }: MultiDateAvailabilityOverviewProps) {
  const { t } = useTranslation();
  const { bandMembers } = useBand();
  const { roles } = useRole();
  const { user } = useAuth();
  const allDates = [gig.date, ...gig.dates];
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  const canEditGig = user?.emailVerified && (roles.admin || roles.bandManager);

  // Group band members by instrument
  const membersByInstrument = bandMembers.reduce<Record<string, typeof bandMembers>>((acc, member) => {
    if (!acc[member.instrument]) {
      acc[member.instrument] = [];
    }
    acc[member.instrument].push(member);
    return acc;
  }, {});

  const getDateStats = (date: string) => {
    const stats = {
      available: 0,
      unavailable: 0,
      maybe: 0,
      drivers: 0,
      total: Object.keys(gig.memberAvailability).length,
      byInstrument: {} as Record<string, { available: number; unavailable: number; maybe: number; total: number }>,
    };

    // Initialize instrument stats
    Object.keys(membersByInstrument).forEach(instrument => {
      stats.byInstrument[instrument] = {
        available: 0,
        unavailable: 0,
        maybe: 0,
        total: membersByInstrument[instrument].length,
      };
    });

    // Calculate stats
    bandMembers.forEach(member => {
      const dateAvailability = gig.memberAvailability[member.id]?.dateAvailability?.[date];
      const status = dateAvailability?.status || 'maybe';
      
      stats[status]++;
      if (status === 'available' && dateAvailability?.canDrive) {
        stats.drivers++;
      }

      // Update instrument-specific stats
      if (stats.byInstrument[member.instrument]) {
        stats.byInstrument[member.instrument][status]++;
      }
    });

    return stats;
  };

  const getInstrumentStatus = (instrumentStats: { available: number; maybe: number; total: number }) => {
    const availablePercentage = (instrumentStats.available / instrumentStats.total) * 100;
    const tentativePercentage = (instrumentStats.maybe / instrumentStats.total) * 100;
    
    if (availablePercentage > 50) {
      return 'bg-green-100 text-green-800';
    } else if (availablePercentage + tentativePercentage > 30) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  return (
    <div className="space-y-2">
      {allDates.map((date) => {
        const stats = getDateStats(date);
        const isExpanded = expandedDates[date];

        return (
          <div key={date} className="bg-gray-50 rounded-lg">
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleDate(date)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    {formatDate(date)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {canEditGig && onSelectSingleDate && (
                    <button
                      onClick={() => onSelectSingleDate(date)}
                      className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                      title={t('gigDetails.actions.selectDate')}
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('gigDetails.actions.selectDate')}</span>
                    </button>
                  )}
                  {stats.drivers > 0 && (
                    <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      <Car className="w-4 h-4" />
                      <span className="ml-1 text-xs font-medium">{stats.drivers}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="bg-green-50 text-green-700 px-4 py-1 rounded-full text-base font-medium">
                  {stats.available}
                </div>
                <div className="bg-red-50 text-red-700 px-4 py-1 rounded-full text-base font-medium">
                  {stats.unavailable}
                </div>
                <div className="bg-yellow-50 text-yellow-700 px-4 py-1 rounded-full text-base font-medium">
                  {stats.maybe}
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-200 px-3 py-2 space-y-2">
                {Object.entries(stats.byInstrument).map(([instrument, instrumentStats]) => (
                  <div key={instrument} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{instrument}</span>
                    <div className={`px-3 py-1 rounded-full ${getInstrumentStatus(instrumentStats)}`}>
                      {instrumentStats.available}/{instrumentStats.total}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 