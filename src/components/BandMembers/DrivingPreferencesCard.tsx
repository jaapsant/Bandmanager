import React from 'react';
import { Car, Snowflake, Leaf } from 'lucide-react';
import { TFunction } from 'i18next';
import { BandMember } from '../../types';

interface DrivingPreferencesCardProps {
  bandMembers: BandMember[];
  t: TFunction;
}

/**
 * Sort members by driving availability status
 */
function sortMembersByDrivingStatus(members: BandMember[]): BandMember[] {
  return [...members].sort((a, b) => {
    // Define sort order: available (0), maybe (1), unavailable (2), unknown/undefined (3)
    const getStatusPriority = (status?: string) => {
      if (status === 'available') return 0;
      if (status === 'maybe') return 1;
      if (status === 'unavailable') return 2;
      return 3; // unknown/undefined
    };

    const priorityA = getStatusPriority(a.drivingAvailability?.status);
    const priorityB = getStatusPriority(b.drivingAvailability?.status);

    // First sort by status priority
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // If status is the same, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

export function DrivingPreferencesCard({ bandMembers, t }: DrivingPreferencesCardProps) {
  const sortedMembers = sortMembersByDrivingStatus(bandMembers);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <Car className="w-5 h-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">{t('bandMembers.driving.title')}</h3>
      </div>
      <table className="w-full table-fixed divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="pl-6 pr-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-auto">
              {t('bandMembers.driving.table.name')}
            </th>
            <th scope="col" className="sm:hidden pr-6 pl-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              {/* Icons column on mobile */}
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('bandMembers.driving.table.status')}
            </th>
            <th scope="col" className="hidden sm:table-cell px-3 py-2 text-center">
              {/* Winter Tyres - icon only */}
            </th>
            <th scope="col" className="hidden sm:table-cell pr-6 pl-3 py-2 text-center">
              {/* Environment Sticker - icon only */}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sortedMembers.map((member) => {
            const status = member.drivingAvailability?.status;
            const hasWinterTyres = member.drivingAvailability?.hasWinterTyres;
            const hasSticker = member.drivingAvailability?.hasGermanEnvironmentSticker;
            const remark = member.drivingAvailability?.remark;

            return (
              <React.Fragment key={member.id}>
                {/* Main row with member info */}
                <tr className="border-t border-gray-200">
                  <td className="pl-6 pr-3 py-2 text-sm font-medium text-gray-900">
                    {member.name}
                  </td>
                  {/* Mobile: All icons in one column */}
                  <td className="sm:hidden pr-6 pl-3 py-2">
                    <div className="flex items-center justify-center gap-2">
                      {status === 'available' && (
                        <div title={t('gigs.available')}>
                          <Car className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      {status === 'maybe' && (
                        <div title={t('gigs.maybe')}>
                          <Car className="w-5 h-5 text-yellow-500" />
                        </div>
                      )}
                      {(status === 'unavailable' || !status) && (
                        <div title={t('gigs.unavailable')}>
                          <Car className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      {hasWinterTyres && (
                        <div title={t('bandMembers.driving.hasWinterTyres')}>
                          <Snowflake className="w-5 h-5 text-blue-500" />
                        </div>
                      )}
                      {hasSticker && (
                        <div title={t('bandMembers.driving.hasEnvironmentSticker')}>
                          <Leaf className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>
                  </td>
                  {/* Desktop: Separate columns */}
                  <td className="hidden sm:table-cell px-3 py-2 text-center">
                    {status === 'available' && (
                      <div title={t('gigs.available')} className="inline-block">
                        <Car className="w-5 h-5 text-green-600 mx-auto" />
                      </div>
                    )}
                    {status === 'maybe' && (
                      <div title={t('gigs.maybe')} className="inline-block">
                        <Car className="w-5 h-5 text-yellow-500 mx-auto" />
                      </div>
                    )}
                    {(status === 'unavailable' || !status) && (
                      <div title={t('gigs.unavailable')} className="inline-block">
                        <Car className="w-5 h-5 text-gray-300 mx-auto" />
                      </div>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-2 text-center">
                    {hasWinterTyres ? (
                      <div title={t('bandMembers.driving.hasWinterTyres')} className="inline-block">
                        <Snowflake className="w-5 h-5 text-blue-500 mx-auto" />
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell pr-6 pl-3 py-2 text-center">
                    {hasSticker ? (
                      <div title={t('bandMembers.driving.hasEnvironmentSticker')} className="inline-block">
                        <Leaf className="w-5 h-5 text-green-600 mx-auto" />
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>

                {/* Remark row - only shown on desktop if remark exists */}
                {remark && (
                  <tr className="hidden sm:table-row border-t-0">
                    <td colSpan={4} className="pl-6 pr-6 pt-0 pb-2 text-xs text-gray-600 italic break-words">
                      {remark}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
