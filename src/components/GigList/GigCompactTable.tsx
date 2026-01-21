import { BarChart3 } from 'lucide-react';
import { TFunction } from 'i18next';
import { Gig } from '../../types';
import { GigTableRow } from './GigTableRow';

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface GigCompactTableProps {
  gigs: Gig[];
  userId: string | undefined;
  showHistory: boolean;
  statusOptions: StatusOption[];
  yearHeader?: string;
  isExpanded?: boolean;
  onToggleYear?: (year: string) => void;
  onNavigateToGig: (gigId: string) => void;
  onNavigateToYearOverview?: (year: string) => void;
  t: TFunction;
}

export function GigCompactTable({
  gigs,
  userId,
  showHistory,
  statusOptions,
  yearHeader,
  isExpanded = true,
  onToggleYear,
  onNavigateToGig,
  onNavigateToYearOverview,
  t,
}: GigCompactTableProps) {
  return (
    <>
      {yearHeader && (
        <div className="flex items-center mb-4">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => onToggleYear?.(yearHeader)}
          >
            <h2 className="text-xl font-semibold text-gray-800">
              {yearHeader}
            </h2>
            <button className="ml-2 text-gray-500">
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
          {onNavigateToYearOverview && (
            <button
              onClick={() => onNavigateToYearOverview(yearHeader)}
              className="ml-4 text-gray-500 hover:text-red-600"
              title="View Year Overview"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
      {(!yearHeader || isExpanded) && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-24 sm:w-auto px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('gigList.table.date')}
                </th>
                <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('gigList.table.gig')}
                </th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('gigList.table.status')}
                </th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('gigList.table.time')}
                </th>
                {!showHistory && (
                  <th className="hidden md:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('gigList.table.yourStatus')}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gigs.map((gig) => (
                <GigTableRow
                  key={gig.id}
                  gig={gig}
                  userId={userId}
                  showHistory={showHistory}
                  statusOptions={statusOptions}
                  onNavigate={onNavigateToGig}
                  t={t}
                />
              ))}
            </tbody>
          </table>
          {gigs.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {showHistory ? t('gigList.table.noGigs.past') : t('gigList.table.noGigs.upcoming')}
            </div>
          )}
        </div>
      )}
    </>
  );
}
