import { GigCard } from '../components/GigCard';
import { useGigList } from '../hooks/useGigList';
import { useStatusOptions } from '../data';
import { GigListHeader, GigCompactTable } from '../components/GigList';
import { Gig } from '../types';

export function GigList() {
  const statusOptions = useStatusOptions();
  const {
    upcomingGigs,
    groupedPastGigs,
    user,
    loading,
    showHistory,
    viewMode,
    canManageGigs,
    setShowHistory,
    setViewMode,
    toggleYear,
    navigateToGig,
    navigateToNewGig,
    navigateToBandMembers,
    navigateToYearOverview,
    isYearExpanded,
    t,
  } = useGigList();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('gigList.loading')}</div>
      </div>
    );
  }

  const renderGridView = (gigs: Gig[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gigs.map((gig) => (
        <GigCard key={gig.id} gig={gig} />
      ))}
      {gigs.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-8">
          No upcoming gigs found
        </div>
      )}
    </div>
  );

  const renderCompactView = () => (
    <GigCompactTable
      gigs={upcomingGigs}
      userId={user?.uid}
      showHistory={false}
      statusOptions={statusOptions}
      onNavigateToGig={navigateToGig}
      t={t}
    />
  );

  const renderHistoryView = () => (
    <>
      {Object.entries(groupedPastGigs)
        .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
        .map(([year, yearGigs]) => (
          <GigCompactTable
            key={year}
            gigs={yearGigs}
            userId={user?.uid}
            showHistory={true}
            statusOptions={statusOptions}
            yearHeader={year}
            isExpanded={isYearExpanded(year)}
            onToggleYear={toggleYear}
            onNavigateToGig={navigateToGig}
            onNavigateToYearOverview={navigateToYearOverview}
            t={t}
          />
        ))}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GigListHeader
          showHistory={showHistory}
          viewMode={viewMode}
          canManageGigs={canManageGigs}
          isEmailVerified={user?.emailVerified || false}
          onSetShowHistory={setShowHistory}
          onSetViewMode={setViewMode}
          onNavigateToNewGig={navigateToNewGig}
          onNavigateToBandMembers={navigateToBandMembers}
          t={t}
        />

        {showHistory
          ? renderHistoryView()
          : viewMode === 'grid'
            ? renderGridView(upcomingGigs)
            : renderCompactView()
        }
      </div>
    </div>
  );
}
