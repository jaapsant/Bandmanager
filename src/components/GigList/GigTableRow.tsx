import { Calendar, CalendarRange, AlertCircle } from 'lucide-react';
import { TFunction } from 'i18next';
import { Gig, AvailabilityStatusValue } from '../../types';
import { AvailabilityStatus } from '../AvailabilityStatus';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface GigTableRowProps {
  gig: Gig;
  userId: string | undefined;
  showHistory: boolean;
  statusOptions: StatusOption[];
  onNavigate: (gigId: string) => void;
  t: TFunction;
}

export function GigTableRow({
  gig,
  userId,
  showHistory,
  statusOptions,
  onNavigate,
  t,
}: GigTableRowProps) {
  const hasUserAvailability = userId && gig.memberAvailability[userId]?.status;
  const userStatus = userId ? gig.memberAvailability[userId]?.status : undefined;

  const getStatusColor = (status: AvailabilityStatusValue) => {
    switch (status) {
      case 'available':
        return 'text-green-600';
      case 'unavailable':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusBadgeClass = () => {
    if (gig.status === 'completed') {
      return 'bg-blue-100 text-blue-800';
    }
    return statusOptions.find(s => s.value === gig.status)?.color || '';
  };

  const getStatusLabel = () => {
    if (gig.status === 'completed') {
      return 'Completed';
    }
    return statusOptions.find(s => s.value === gig.status)?.label || gig.status;
  };

  return (
    <tr
      className={`hover:bg-gray-50 cursor-pointer ${!hasUserAvailability && !showHistory ? 'bg-yellow-50' : ''}`}
      onClick={() => onNavigate(gig.id)}
    >
      {/* Date column - with time on mobile */}
      <td className="px-3 md:px-6 py-3 md:py-4 text-sm whitespace-nowrap">
        <div className="flex items-center text-gray-700">
          {gig.isMultiDay ? (
            <>
              <CalendarRange className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {new Date(gig.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {' - '}
                {new Date(gig.dates[gig.dates.length - 1] || gig.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-1.5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {new Date(gig.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </>
          )}
        </div>
        {/* Time below date - mobile only */}
        {!gig.isMultiDay && (gig.isWholeDay || (gig.startTime && gig.endTime)) && (
          <div className="sm:hidden text-xs text-gray-500 pl-5 mt-1">
            {gig.isWholeDay
              ? t('gigList.table.allDay')
              : `${gig.startTime} - ${gig.endTime}`}
          </div>
        )}
      </td>

      {/* Gig column - stacks more info on mobile */}
      <td className="px-3 md:px-6 py-3 md:py-4">
        <div className="text-sm font-medium text-gray-900 mb-1">{gig.name}</div>

        {/* Show on mobile: status badge and availability icon */}
        <div className="sm:hidden">
          <div className="flex items-center gap-2">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass()}`}>
              {getStatusLabel()}
            </span>
            {!showHistory && (
              hasUserAvailability ? (
                <AvailabilityStatus status={userStatus as AvailabilityStatusValue} size="sm" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )
            )}
          </div>
        </div>

        {/* Location and pay - always visible */}
        <div className="text-xs sm:text-sm text-gray-500 mt-1">
          {gig.location}
          {gig.distance && (
            <span className="text-gray-400 ml-1">
              ({gig.distance} km)
            </span>
          )}
        </div>
        {gig.pay && (
          <div className="text-xs sm:text-sm text-gray-500">€ {gig.pay},-</div>
        )}
      </td>

      {/* Status column - hidden on mobile */}
      <td className="hidden sm:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass()}`}>
          {getStatusLabel()}
        </span>
      </td>

      {/* Time column - hidden on mobile and tablet */}
      <td className="hidden lg:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm">
        {gig.isWholeDay ? (
          t('gigList.table.allDay')
        ) : (
          gig.startTime && gig.endTime ? `${gig.startTime} - ${gig.endTime}` : ''
        )}
      </td>

      {/* User status column - hidden on mobile, show on desktop for non-history view */}
      {!showHistory && (
        <td className="hidden md:table-cell px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
          {hasUserAvailability ? (
            <span className={`text-sm ${getStatusColor(userStatus as AvailabilityStatusValue)}`}>
              {userStatus}
            </span>
          ) : (
            <span className="flex items-center text-yellow-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {t('gigList.table.needed')}
            </span>
          )}
        </td>
      )}
    </tr>
  );
}
