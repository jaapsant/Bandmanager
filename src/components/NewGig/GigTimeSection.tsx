import { TFunction } from 'i18next';

interface GigTimeSectionProps {
  isMultiDay: boolean;
  isWholeDay: boolean;
  startTime: string | null;
  endTime: string | null;
  onWholeDayChange: (isWholeDay: boolean) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  t: TFunction;
}

export function GigTimeSection({
  isMultiDay,
  isWholeDay,
  startTime,
  endTime,
  onWholeDayChange,
  onStartTimeChange,
  onEndTimeChange,
  t,
}: GigTimeSectionProps) {
  if (isMultiDay) {
    return null;
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newGig.form.wholeDay.label')}
        </label>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="isWholeDay"
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            checked={isWholeDay}
            onChange={(e) => onWholeDayChange(e.target.checked)}
          />
          <label htmlFor="isWholeDay" className="ml-2 block text-sm text-gray-700">
            {t('newGig.form.wholeDay.checkbox')}
          </label>
        </div>
      </div>

      {!isWholeDay && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('newGig.form.time.start')}
            </label>
            <input
              type="time"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={startTime || ''}
              onChange={(e) => onStartTimeChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('newGig.form.time.end')}
            </label>
            <input
              type="time"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={endTime || ''}
              onChange={(e) => onEndTimeChange(e.target.value)}
            />
          </div>
        </>
      )}
    </>
  );
}
