import { ArrowLeft } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import {
  NameUpdateCard,
  InstrumentUpdateCard,
  SheetMusicCard,
  DrivingPreferencesCard,
  PasswordUpdateCard,
} from '../components/Profile';

export function Profile() {
  const {
    name,
    setName,
    selectedInstrument,
    setSelectedInstrument,
    instruments,
    wantsPrintedSheetMusic,
    setWantsPrintedSheetMusic,
    drivingStatus,
    setDrivingStatus,
    hasWinterTyres,
    setHasWinterTyres,
    hasGermanEnvironmentSticker,
    setHasGermanEnvironmentSticker,
    drivingRemark,
    setDrivingRemark,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    success,
    loading,
    handleUpdateName,
    handleUpdateInstrument,
    handleUpdateSheetMusicPreference,
    handleUpdateDrivingPreferences,
    handleUpdatePassword,
    navigateBack,
    t,
  } = useProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('profile.navigation.backToGigs')}
        </button>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          <NameUpdateCard
            name={name}
            onNameChange={setName}
            onSubmit={handleUpdateName}
            loading={loading}
            t={t}
          />

          <InstrumentUpdateCard
            selectedInstrument={selectedInstrument}
            onInstrumentChange={setSelectedInstrument}
            instruments={instruments}
            onSubmit={handleUpdateInstrument}
            loading={loading}
            t={t}
          />

          <SheetMusicCard
            wantsPrintedSheetMusic={wantsPrintedSheetMusic}
            onWantsPrintedChange={setWantsPrintedSheetMusic}
            onSubmit={handleUpdateSheetMusicPreference}
            loading={loading}
            t={t}
          />

          <DrivingPreferencesCard
            drivingStatus={drivingStatus}
            onDrivingStatusChange={setDrivingStatus}
            hasWinterTyres={hasWinterTyres}
            onHasWinterTyresChange={setHasWinterTyres}
            hasGermanEnvironmentSticker={hasGermanEnvironmentSticker}
            onHasGermanEnvironmentStickerChange={setHasGermanEnvironmentSticker}
            drivingRemark={drivingRemark}
            onDrivingRemarkChange={setDrivingRemark}
            onSubmit={handleUpdateDrivingPreferences}
            loading={loading}
            t={t}
          />

          <PasswordUpdateCard
            currentPassword={currentPassword}
            onCurrentPasswordChange={setCurrentPassword}
            newPassword={newPassword}
            onNewPasswordChange={setNewPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleUpdatePassword}
            loading={loading}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
