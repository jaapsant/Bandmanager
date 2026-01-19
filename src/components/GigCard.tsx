import { Calendar, Clock, AlertCircle, Car, MapPin, Euro } from 'lucide-react';
import { CalendarRange } from 'lucide-react';
import { Gig } from '../types';
import { useStatusOptions } from '../data';
import { Link, useNavigate } from 'react-router-dom';
import { AvailabilityOverview } from './AvailabilityOverview';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { AvailabilityStatus } from './AvailabilityStatus';
import { useBand } from '../context/BandContext';
import { useGigStats } from '../hooks/useGigStats';
import { formatDate, formatDateShort } from '../utils/dateFormat';

interface GigCardProps {
  gig: Gig;
}

export function GigCard({ gig }: GigCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { bandMembers } = useBand();
  const { totalDrivers } = useGigStats(gig, bandMembers);

  const isPastGig = new Date(gig.date) < new Date();

  const statusOptions = useStatusOptions();

  const status = gig.status === 'completed'
    ? { value: 'completed', label: t('gig.status.completed'), color: 'bg-blue-100 text-blue-800' }
    : statusOptions.find((s) => s.value === gig.status);

  const hasUserAvailability = user && gig.memberAvailability[user.uid]?.status;

  const formatTime = () => {
    if (gig.isWholeDay) {
      return t('gig.time.allDay');
    }
    if (gig.startTime && gig.endTime) {
      return `${gig.startTime} - ${gig.endTime}`;
    }
    return "";
  };

  return (
    <div
      onClick={() => navigate(`/gig/${gig.id}`)}
      className={`bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow p-4 ${!hasUserAvailability ? 'ring-2 ring-yellow-400' : ''
        }`}
    >
      <div className="mb-4">
        <Link to={`/gig/${gig.id}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{gig.name}</h3>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${status?.color}`}>
            {status?.label}
          </span>
          {!hasUserAvailability && !isPastGig ? (
            <span
              className="flex items-center text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded whitespace-nowrap"
              onClick={(e) => e.stopPropagation()}
            >
              <AlertCircle className="w-3 h-3 mr-1" />
              {t('gig.availability.setAvailability')}
            </span>
          ) : hasUserAvailability && (
            <span
              className="flex items-center px-2 py-1 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <AvailabilityStatus status={gig.memberAvailability[user.uid].status} />
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 flex-grow">
        <div className="flex items-center text-gray-600">
          {gig.isMultiDay ? (
            <div className="flex items-center">
              <CalendarRange className="w-4 h-4 mr-2" />
              <span className="font-medium">
                {formatDateShort(gig.date)}
                {' - '}
                {formatDateShort(gig.dates[gig.dates.length - 1] || gig.date)}
              </span>
            </div>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              <span>{formatDate(gig.date)}</span>
            </>
          )}
        </div>

        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <span>{formatTime()}</span>
        </div>

        {gig.location && (
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            <span>
              {gig.location}
              {gig.distance && (
                <span className="text-gray-400 ml-2">
                  ({gig.distance} km)
                </span>
              )}
            </span>
          </div>
        )}

        {gig.pay && (
          <div className="flex items-center text-gray-600 ">
            <Euro className="w-4 h-4 mr-2" />
            <span>{gig.pay},-</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <AvailabilityOverview memberAvailability={gig.memberAvailability} compact />
          {totalDrivers > 0 && (
            <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Car className="w-4 h-4" />
              <span className="ml-1 text-xs font-medium">{totalDrivers}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}