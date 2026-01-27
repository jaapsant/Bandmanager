import { TFunction } from 'i18next';
import { Route, Loader2 } from 'lucide-react';

interface GigLocationSectionProps {
  location: string;
  distance: number | null;
  onLocationChange: (location: string) => void;
  onDistanceChange: (distance: string) => void;
  onCalculateDistance?: () => void;
  isCalculatingDistance?: boolean;
  t: TFunction;
}

export function GigLocationSection({
  location,
  distance,
  onLocationChange,
  onDistanceChange,
  onCalculateDistance,
  isCalculatingDistance = false,
  t,
}: GigLocationSectionProps) {
  const canCalculate = location.trim().length > 0 && !isCalculatingDistance;

  return (
    <div className="md:col-span-2 grid grid-cols-4 gap-6">
      <div className="col-span-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newGig.form.location.label')}
        </label>
        <input
          type="text"
          placeholder={t('newGig.form.location.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
        />
      </div>

      <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newGig.form.distance.label')}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.1"
            placeholder={t('newGig.form.distance.placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={distance || ''}
            onChange={(e) => onDistanceChange(e.target.value)}
          />
          {onCalculateDistance && (
            <button
              type="button"
              onClick={onCalculateDistance}
              disabled={!canCalculate}
              className={`px-3 py-2 rounded-md transition-colors flex items-center justify-center ${
                canCalculate
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
              title={
                !location.trim()
                  ? t('newGig.form.distance.error.emptyLocation')
                  : t('newGig.form.distance.calculate')
              }
            >
              {isCalculatingDistance ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Route className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
