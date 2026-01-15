import { TFunction } from 'i18next';

interface GigLocationSectionProps {
  location: string;
  distance: number | null;
  onLocationChange: (location: string) => void;
  onDistanceChange: (distance: string) => void;
  t: TFunction;
}

export function GigLocationSection({
  location,
  distance,
  onLocationChange,
  onDistanceChange,
  t,
}: GigLocationSectionProps) {
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
        <input
          type="number"
          min="0"
          step="0.1"
          placeholder={t('newGig.form.distance.placeholder')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={distance || ''}
          onChange={(e) => onDistanceChange(e.target.value)}
        />
      </div>
    </div>
  );
}
