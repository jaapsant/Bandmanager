import { TFunction } from 'i18next';

interface GigDateSectionProps {
  isMultiDay: boolean;
  date: string;
  dates: string[];
  today: string;
  onMultiDayChange: (isMultiDay: boolean) => void;
  onDateChange: (date: string) => void;
  onAddDate: () => void;
  onRemoveDate: (index: number) => void;
  onDateAtIndexChange: (index: number, date: string) => void;
  t: TFunction;
}

export function GigDateSection({
  isMultiDay,
  date,
  dates,
  today,
  onMultiDayChange,
  onDateChange,
  onAddDate,
  onRemoveDate,
  onDateAtIndexChange,
  t,
}: GigDateSectionProps) {
  return (
    <>
      {/* Multi-day checkbox */}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newGig.form.multiDay.label')}
        </label>
        <div className="flex items-center mt-2">
          <input
            type="checkbox"
            id="isMultiDay"
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            checked={isMultiDay}
            onChange={(e) => onMultiDayChange(e.target.checked)}
          />
          <label htmlFor="isMultiDay" className="ml-2 block text-sm text-gray-700">
            {t('newGig.form.multiDay.checkbox')}
          </label>
        </div>
      </div>

      {/* Date input(s) */}
      <div className={isMultiDay ? 'md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isMultiDay ? t('newGig.form.dates.label') : t('newGig.form.date.label')}
        </label>
        <div className="space-y-4">
          <input
            type="date"
            required
            min={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
          />

          {isMultiDay && (
            <div className="space-y-4">
              {dates.map((dateValue, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="date"
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={dateValue}
                    onChange={(e) => onDateAtIndexChange(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveDate(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    {t('newGig.form.dates.remove')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={onAddDate}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('newGig.form.dates.addDate')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
