import React from 'react';
import { useTranslation } from 'react-i18next';
import { Gig, AvailabilityStatus as AvailabilityStatusType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Car } from 'lucide-react';
import { AvailabilityStatus } from './AvailabilityStatus';

interface MultiDateAvailabilityProps {
  gig: Gig;
  onUpdateAvailability: (date: string, status: AvailabilityStatus['value'], note?: string) => Promise<void>;
  onUpdateDrivingStatus?: (date: string, canDrive: boolean) => Promise<void>;
}

export function MultiDateAvailability({ gig, onUpdateAvailability, onUpdateDrivingStatus }: MultiDateAvailabilityProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const allDates = [gig.date, ...gig.dates];

  const getAvailabilityForDate = (date: string) => {
    return user ? gig.memberAvailability[user.uid]?.dateAvailability?.[date] : undefined;
  };

  return (
    <div className="space-y-4">
      {allDates.map((date) => {
        const availability = getAvailabilityForDate(date);
        return (
          <div key={date} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                {new Date(date).toLocaleDateString()}
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onUpdateAvailability(date, 'available')}
                    className={`p-2 rounded-full hover:bg-green-100 ${
                      availability?.status === 'available' ? 'bg-green-100' : ''
                    }`}
                    title={t('gigs.available')}
                  >
                    <AvailabilityStatus status="available" />
                  </button>
                  <button
                    onClick={() => onUpdateAvailability(date, 'unavailable')}
                    className={`p-2 rounded-full hover:bg-red-100 ${
                      availability?.status === 'unavailable' ? 'bg-red-100' : ''
                    }`}
                    title={t('gigs.unavailable')}
                  >
                    <AvailabilityStatus status="unavailable" />
                  </button>
                  <button
                    onClick={() => onUpdateAvailability(date, 'maybe')}
                    className={`p-2 rounded-full hover:bg-yellow-100 ${
                      availability?.status === 'maybe' ? 'bg-yellow-100' : ''
                    }`}
                    title={t('gigs.maybe')}
                  >
                    <AvailabilityStatus status="maybe" />
                  </button>
                </div>
                {availability?.status === 'available' && onUpdateDrivingStatus && (
                  <button
                    onClick={() => onUpdateDrivingStatus(date, !availability.canDrive)}
                    className={`p-2 rounded-full hover:bg-blue-100 ${
                      availability.canDrive ? 'bg-blue-100 text-blue-600' : 'text-gray-400'
                    }`}
                    title={t('gigDetails.status.canDrive')}
                  >
                    <Car className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2">
              <textarea
                placeholder={t('gigDetails.sections.notePlaceholder')}
                value={availability?.note || ''}
                onChange={(e) => onUpdateAvailability(date, availability?.status || 'maybe', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={2}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
} 