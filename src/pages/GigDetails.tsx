import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStatusOptions } from '../data';
import { useGigDetails } from '../hooks/useGigDetails';
import {
  GigHeader,
  GigInfoSection,
  UserAvailabilitySection,
  BandMembersSection,
  DeleteConfirmDialog,
} from '../components/GigDetails';

export function GigDetails() {
  const statusOptions = useStatusOptions();
  const { id } = useParams<{ id: string }>();

  const {
    gig,
    allGigs,
    editedGig,
    user,
    bandMembers,
    gigStats,
    isEditing,
    error,
    showDeleteConfirm,
    isPastGig,
    canEditGig,
    handleEdit,
    handleCancel,
    handleSave,
    handleDelete,
    handleBack,
    setShowDeleteConfirm,
    setEditedGig,
    handleUpdateAvailability,
    handleUpdateDrivingStatus,
    updateAvailability,
    updateNote,
    toggleDriving,
    updateMemberAvailability,
    toggleMemberDriving,
    handleSelectSingleDate,
    formatTime,
    openInGoogleMaps,
    updateGig,
    t,
  } = useGigDetails(id);

  if (!gig) return <div>{t('gigDetails.errors.notFound')}</div>;
  if (!user) return <div>{t('gigDetails.errors.signIn')}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('common.backToGigs')}
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <GigHeader
            gig={gig}
            editedGig={editedGig}
            isEditing={isEditing}
            isPastGig={isPastGig}
            canEditGig={canEditGig}
            statusOptions={statusOptions}
            bandMembers={bandMembers}
            allGigs={allGigs}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={() => setShowDeleteConfirm(true)}
            onUpdateGig={setEditedGig}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GigInfoSection
              gig={gig}
              editedGig={editedGig}
              isEditing={isEditing}
              isPastGig={isPastGig}
              totalDrivers={gigStats.totalDrivers}
              formatTime={formatTime}
              openInGoogleMaps={openInGoogleMaps}
              onUpdateGig={setEditedGig}
              onSelectSingleDate={handleSelectSingleDate}
              t={t}
            />

            <div>
              <UserAvailabilitySection
                gig={gig}
                user={user}
                isPastGig={isPastGig}
                updateAvailability={updateAvailability}
                updateNote={updateNote}
                toggleDriving={toggleDriving}
                onUpdateAvailability={handleUpdateAvailability}
                onUpdateDrivingStatus={handleUpdateDrivingStatus}
                t={t}
              />

              <BandMembersSection
                gig={gig}
                user={user}
                bandMembers={bandMembers}
                canEditGig={canEditGig}
                sortedInstruments={gigStats.sortedInstruments}
                membersByInstrument={gigStats.membersByInstrument}
                updateMemberAvailability={updateMemberAvailability}
                toggleMemberDriving={toggleMemberDriving}
                updateGig={updateGig}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        gigName={gig.name}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        t={t}
      />
    </div>
  );
}
