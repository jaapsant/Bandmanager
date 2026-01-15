import { ArrowLeft } from 'lucide-react';
import { useBandMembers } from '../hooks/useBandMembers';
import {
  InstrumentMembersCard,
  DrivingPreferencesCard,
  SheetMusicSummaryCard,
} from '../components/BandMembers';

export function BandMembers() {
  const {
    bandMembers,
    instruments,
    membersByInstrument,
    sheetMusicSummary,
    totalWantsPrinted,
    totalMembers,
    user,
    loading,
    showInstrumentForm,
    newInstrument,
    error,
    success,
    activeMember,
    canManageBand,
    sensors,
    setShowInstrumentForm,
    setNewInstrument,
    handleDragStart,
    handleDragEnd,
    handleInstrumentSubmit,
    handleRemoveInstrument,
    navigateBack,
    t,
  } = useBandMembers();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('bandMembers.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('bandMembers.navigation.backToGigs')}
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        <InstrumentMembersCard
          instruments={instruments}
          membersByInstrument={membersByInstrument}
          activeMember={activeMember}
          canManageBand={canManageBand}
          userId={user?.uid}
          sensors={sensors}
          showInstrumentForm={showInstrumentForm}
          newInstrument={newInstrument}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onRemoveInstrument={handleRemoveInstrument}
          onShowInstrumentForm={() => setShowInstrumentForm(true)}
          onHideInstrumentForm={() => setShowInstrumentForm(false)}
          onNewInstrumentChange={setNewInstrument}
          onInstrumentSubmit={handleInstrumentSubmit}
          isEmailVerified={user?.emailVerified || false}
          t={t}
        />

        {totalMembers > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DrivingPreferencesCard bandMembers={bandMembers} t={t} />
            <SheetMusicSummaryCard
              sheetMusicSummary={sheetMusicSummary}
              totalWantsPrinted={totalWantsPrinted}
              totalMembers={totalMembers}
              t={t}
            />
          </div>
        )}
      </div>
    </div>
  );
}
