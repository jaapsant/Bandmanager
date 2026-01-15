import { TFunction } from 'i18next';
import { AvailabilityStatus } from '../AvailabilityStatus';
import { AvailabilityStatusValue } from '../../types';

interface DrivingPreferencesCardProps {
  drivingStatus: AvailabilityStatusValue;
  onDrivingStatusChange: (status: AvailabilityStatusValue) => void;
  hasWinterTyres: boolean;
  onHasWinterTyresChange: (has: boolean) => void;
  hasGermanEnvironmentSticker: boolean;
  onHasGermanEnvironmentStickerChange: (has: boolean) => void;
  drivingRemark: string;
  onDrivingRemarkChange: (remark: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  t: TFunction;
}

export function DrivingPreferencesCard({
  drivingStatus,
  onDrivingStatusChange,
  hasWinterTyres,
  onHasWinterTyresChange,
  hasGermanEnvironmentSticker,
  onHasGermanEnvironmentStickerChange,
  drivingRemark,
  onDrivingRemarkChange,
  onSubmit,
  loading,
  t,
}: DrivingPreferencesCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('profile.sections.driving.title')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('profile.sections.driving.availabilityLabel')}
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => onDrivingStatusChange('available')}
              className={`p-3 rounded-full transition-colors ${
                drivingStatus === 'available'
                  ? 'bg-green-100 ring-2 ring-green-500'
                  : 'hover:bg-gray-100'
              }`}
              title={t('gigs.available')}
            >
              <AvailabilityStatus status="available" />
            </button>
            <button
              type="button"
              onClick={() => onDrivingStatusChange('unavailable')}
              className={`p-3 rounded-full transition-colors ${
                drivingStatus === 'unavailable'
                  ? 'bg-red-100 ring-2 ring-red-500'
                  : 'hover:bg-gray-100'
              }`}
              title={t('gigs.unavailable')}
            >
              <AvailabilityStatus status="unavailable" />
            </button>
            <button
              type="button"
              onClick={() => onDrivingStatusChange('maybe')}
              className={`p-3 rounded-full transition-colors ${
                drivingStatus === 'maybe'
                  ? 'bg-yellow-100 ring-2 ring-yellow-500'
                  : 'hover:bg-gray-100'
              }`}
              title={t('gigs.maybe')}
            >
              <AvailabilityStatus status="maybe" />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasWinterTyres"
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              checked={hasWinterTyres}
              onChange={(e) => onHasWinterTyresChange(e.target.checked)}
            />
            <label htmlFor="hasWinterTyres" className="ml-2 text-sm font-medium text-gray-700">
              {t('profile.sections.driving.winterTyres')}
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasGermanEnvironmentSticker"
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              checked={hasGermanEnvironmentSticker}
              onChange={(e) => onHasGermanEnvironmentStickerChange(e.target.checked)}
            />
            <label
              htmlFor="hasGermanEnvironmentSticker"
              className="ml-2 text-sm font-medium text-gray-700"
            >
              {t('profile.sections.driving.environmentSticker')}
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="drivingRemark" className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.sections.driving.remarkLabel')}
          </label>
          <textarea
            id="drivingRemark"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={drivingRemark}
            onChange={(e) => onDrivingRemarkChange(e.target.value)}
            placeholder={t('profile.sections.driving.remarkPlaceholder')}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {t('profile.sections.driving.button')}
          </button>
        </div>
      </form>
    </div>
  );
}
