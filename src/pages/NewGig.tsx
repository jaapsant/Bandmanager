import { ArrowLeft } from 'lucide-react';
import { useNewGig } from '../hooks/useNewGig';
import {
  GigNameField,
  GigDateSection,
  GigTimeSection,
  GigLocationSection,
  GigDetailsSection,
  GigFormActions,
} from '../components/NewGig';

export function NewGig() {
  const {
    formData,
    sendEmailNotification,
    setSendEmailNotification,
    error,
    isSubmitting,
    isCalculatingDistance,
    today,
    handleSubmit,
    handleNameChange,
    handleMultiDayChange,
    handleLocationChange,
    handleDistanceChange,
    handleCalculateDistance,
    handleDateChange,
    handleWholeDayChange,
    handleStartTimeChange,
    handleEndTimeChange,
    handlePayChange,
    handleDescriptionChange,
    handleAddDate,
    handleRemoveDate,
    handleDateAtIndexChange,
    navigateBack,
    t,
  } = useNewGig();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={navigateBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('newGig.navigation.backToGigs')}
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('newGig.title')}</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GigNameField
                name={formData.name}
                onNameChange={handleNameChange}
                t={t}
              />

              <GigDateSection
                isMultiDay={formData.isMultiDay}
                date={formData.date}
                dates={formData.dates}
                today={today}
                onMultiDayChange={handleMultiDayChange}
                onDateChange={handleDateChange}
                onAddDate={handleAddDate}
                onRemoveDate={handleRemoveDate}
                onDateAtIndexChange={handleDateAtIndexChange}
                t={t}
              />

              <GigLocationSection
                location={formData.location}
                distance={formData.distance}
                onLocationChange={handleLocationChange}
                onDistanceChange={handleDistanceChange}
                onCalculateDistance={handleCalculateDistance}
                isCalculatingDistance={isCalculatingDistance}
                t={t}
              />

              <GigTimeSection
                isMultiDay={formData.isMultiDay}
                isWholeDay={formData.isWholeDay}
                startTime={formData.startTime}
                endTime={formData.endTime}
                onWholeDayChange={handleWholeDayChange}
                onStartTimeChange={handleStartTimeChange}
                onEndTimeChange={handleEndTimeChange}
                t={t}
              />

              <GigDetailsSection
                pay={formData.pay}
                description={formData.description}
                onPayChange={handlePayChange}
                onDescriptionChange={handleDescriptionChange}
                t={t}
              />
            </div>

            <GigFormActions
              sendEmailNotification={sendEmailNotification}
              onSendEmailNotificationChange={setSendEmailNotification}
              isSubmitting={isSubmitting}
              onCancel={navigateBack}
              t={t}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
