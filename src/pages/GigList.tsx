import { useState, useEffect, useMemo } from 'react';
import { Plus, Users, History, Calendar, LayoutGrid, List, AlertCircle, BarChart3, CalendarRange } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GigCard } from '../components/GigCard';
import { useGigs } from '../context/GigContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { Gig } from '../types';
import { useStatusOptions } from '../data';
import { useTranslation } from 'react-i18next';
import { Menu } from '@headlessui/react';
import { Menu as MenuIcon } from 'lucide-react';

// Add this type for grouped gigs
type GroupedGigs = {
  [year: string]: Gig[];
};

export function GigList() {
  const statusOptions = useStatusOptions();
  const navigate = useNavigate();
  const location = useLocation();
  const { gigs, loading } = useGigs();
  const { user } = useAuth();
  const { roles } = useRole();
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [expandedYears, setExpandedYears] = useState<{ [year: string]: boolean }>({});
  const { t } = useTranslation();

  const canManageGigs = roles.admin || roles.bandManager;

  // Update this useEffect to reset showHistory when location changes
  useEffect(() => {
    const state = location.state as { showHistory?: boolean } | null;
    setShowHistory(state?.showHistory || false);
  }, [location]);

  const sortedGigs = useMemo(() => {
    return [...gigs].sort((a, b) => {
      // For multi-day gigs, use the earliest date for sorting
      const getEarliestDate = (gig: Gig) => {
        if (gig.isMultiDay) {
          const allDates = [gig.date, ...gig.dates].map(date => new Date(date));
          return new Date(Math.min(...allDates.map(d => d.getTime())));
        }
        return new Date(gig.date);
      };

      const dateA = getEarliestDate(a);
      const dateB = getEarliestDate(b);
      return dateA.getTime() - dateB.getTime();
    });
  }, [gigs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('gigList.loading')}</div>
      </div>
    );
  }

  // Split gigs into upcoming and past
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { upcomingGigs, pastGigs } = sortedGigs.reduce<{ upcomingGigs: Gig[]; pastGigs: Gig[] }>(
    (acc, gig) => {
      const gigDate = new Date(gig.date);
      gigDate.setHours(23, 59, 59, 999);

      if (gigDate >= today) {
        acc.upcomingGigs.push(gig);
      } else {
        acc.pastGigs.push(gig);
      }
      return acc;
    },
    { upcomingGigs: [], pastGigs: [] }
  );

  // Sort upcoming gigs by date ascending, past gigs by date descending
  upcomingGigs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  pastGigs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Replace the existing renderCompactView function with this updated version
  const renderCompactView = (gigs: Gig[] | GroupedGigs) => {
    const renderGigRows = (gigsToRender: Gig[]) => (
      gigsToRender.map((gig) => {
        const hasUserAvailability = user && gig.memberAvailability[user.uid]?.status;
        return (
          <tr
            key={gig.id}
            className={`hover:bg-gray-50 cursor-pointer ${!hasUserAvailability && !showHistory ? 'bg-yellow-50' : ''
              }`}
            onClick={() => navigate(`/gig/${gig.id}`)}
          >
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <div className="flex items-center text-gray-500">
                {gig.isMultiDay ? (
                  <CalendarRange className="w-4 h-4 mr-2" />
                ) : (
                  <Calendar className="w-4 h-4 mr-2" />
                )}
                <span>
                  {new Date(gig.date).toLocaleDateString()}
                  {gig.isMultiDay && (
                    <span className="text-xs text-gray-400 ml-1">
                      +{gig.dates.length}
                    </span>
                  )}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-medium text-gray-900">{gig.name}</div>
              <div className="text-sm text-gray-500">
                {gig.location}
                {gig.distance && (
                  <span className="text-gray-400 ml-2">
                    ({gig.distance} km)
                  </span>
                )}
              </div>
              {gig.pay && (
                <div className="text-sm text-gray-500">€ {gig.pay},-</div>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${gig.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : statusOptions.find(s => s.value === gig.status)?.color
                }`}>
                {gig.status === 'completed' ? 'Completed' : statusOptions.find(s => s.value === gig.status)?.label}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              {gig.isWholeDay ? (
                t('gigList.table.allDay')
              ) : (
                gig.startTime && gig.endTime ? `${gig.startTime} - ${gig.endTime}` : ''
              )}
            </td>
            {!showHistory && (
              <td className="px-6 py-4 whitespace-nowrap">
                {hasUserAvailability ? (
                  <span className={`text-sm ${gig.memberAvailability[user.uid].status === 'available'
                    ? 'text-green-600'
                    : gig.memberAvailability[user.uid].status === 'unavailable'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                    }`}>
                    {gig.memberAvailability[user.uid].status}
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
      })
    );

    const renderTable = (gigsToRender: Gig[], yearHeader?: string) => {
      const currentYear = new Date().getFullYear().toString();
      const isExpanded = expandedYears[yearHeader || ''] ?? (yearHeader ? Number(yearHeader) >= Number(currentYear) - 1 : true);

      return (
        <>
          {yearHeader && (
            <div className="flex items-center mb-4">
              <div
                className="flex items-center cursor-pointer"
                onClick={() => setExpandedYears(prev => ({ ...prev, [yearHeader]: !isExpanded }))}
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {yearHeader}
                </h2>
                <button className="ml-2 text-gray-500">
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
              <button
                onClick={() => navigate(`/year-overview/${yearHeader}`)}
                className="ml-4 text-gray-500 hover:text-red-600"
                title="View Year Overview"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
            </div>
          )}
          {(!yearHeader || isExpanded) && (
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('gigList.table.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('gigList.table.gig')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('gigList.table.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('gigList.table.time')}
                    </th>
                    {!showHistory && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('gigList.table.yourStatus')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderGigRows(gigsToRender)}
                </tbody>
              </table>
              {gigsToRender.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No {showHistory ? 'past' : 'upcoming'} gigs found
                </div>
              )}
            </div>
          )}
        </>
      );
    };

    if (showHistory && !Array.isArray(gigs)) {
      // Render grouped gigs
      return Object.entries(gigs)
        .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
        .map(([year, yearGigs]) => (
          <div key={year}>
            {renderTable(yearGigs, year)}
          </div>
        ));
    }

    // Render regular gigs list
    return renderTable(gigs as Gig[]);
  };

  const renderGridView = (gigs: Gig[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gigs.map((gig) => (
        <GigCard key={gig.id} gig={gig} />
      ))}
      {gigs.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-8">
          No {showHistory ? 'past' : 'upcoming'} gigs found
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {showHistory ? t('gigList.title.history') : t('gigList.title.upcoming')}
          </h1>
          <div className="flex items-center">
            {/* Desktop view */}
            <div className="hidden md:flex space-x-4">
              {!showHistory && (
                <div className="flex rounded-md shadow-sm" role="group">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm font-medium border ${viewMode === 'grid'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      } rounded-l-md flex items-center`}
                    title={t('gigList.viewMode.grid')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${viewMode === 'compact'
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      } rounded-r-md flex items-center`}
                    title={t('gigList.viewMode.compact')}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-white text-gray-600 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 border border-gray-300"
                title={showHistory ? t('gigList.buttons.showUpcoming') : t('gigList.buttons.showHistory')}
              >
                {showHistory ? (
                  <Calendar className="w-5 h-5" />
                ) : (
                  <History className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => navigate('/band-members')}
                className="bg-white text-gray-600 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 border border-gray-300"
                title={t('gigList.buttons.bandMembers')}
              >
                <Users className="w-5 h-5" />
              </button>
              {canManageGigs && user?.emailVerified && !showHistory && (
                <button
                  onClick={() => navigate('/gigs/new')}
                  className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('gigList.buttons.newGig')}
                </button>
              )}
            </div>

            {/* Mobile hamburger menu */}
            <div className="md:hidden">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="bg-white p-2 rounded-md hover:bg-gray-50 border border-gray-300">
                  <MenuIcon className="w-5 h-5 text-gray-600" />
                </Menu.Button>

                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-1 py-1">
                    {!showHistory && (
                      <>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setViewMode('grid')}
                              className={`${active ? 'bg-gray-100' : ''
                                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            >
                              <LayoutGrid className="w-4 h-4 mr-2" />
                              {t('gigList.viewMode.grid')}
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => setViewMode('compact')}
                              className={`${active ? 'bg-gray-100' : ''
                                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                            >
                              <List className="w-4 h-4 mr-2" />
                              {t('gigList.viewMode.compact')}
                            </button>
                          )}
                        </Menu.Item>
                      </>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className={`${active ? 'bg-gray-100' : ''
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        >
                          {showHistory ? (
                            <Calendar className="w-5 h-5 mr-2" />
                          ) : (
                            <History className="w-5 h-5 mr-2" />
                          )}
                          {showHistory ? t('gigList.buttons.showUpcoming') : t('gigList.buttons.showHistory')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/band-members')}
                          className={`${active ? 'bg-gray-100' : ''
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        >
                          <Users className="w-5 h-5 mr-2" />
                          {t('gigList.buttons.bandMembers')}
                        </button>
                      )}
                    </Menu.Item>
                    {canManageGigs && user?.emailVerified && !showHistory && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => navigate('/gigs/new')}
                            className={`${active ? 'bg-red-50' : ''
                              } group flex rounded-md items-center w-full px-2 py-2 text-sm text-red-600`}
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            {t('gigList.buttons.newGig')}
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>

        {showHistory ? (
          renderCompactView(pastGigs.reduce<GroupedGigs>((acc, gig) => {
            const year = new Date(gig.date).getFullYear().toString();
            if (!acc[year]) {
              acc[year] = [];
            }
            acc[year].push(gig);
            return acc;
          }, {}))
        ) : (
          viewMode === 'grid' ? renderGridView(upcomingGigs) : renderCompactView(upcomingGigs)
        )}
      </div>
    </div>
  );
}