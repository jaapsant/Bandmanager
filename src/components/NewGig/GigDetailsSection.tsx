import { TFunction } from 'i18next';

interface GigDetailsSectionProps {
  pay: number | null | undefined;
  description: string | undefined;
  onPayChange: (pay: string) => void;
  onDescriptionChange: (description: string) => void;
  t: TFunction;
}

export function GigDetailsSection({
  pay,
  description,
  onPayChange,
  onDescriptionChange,
  t,
}: GigDetailsSectionProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newGig.form.pay.label')}
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={pay || ''}
          onChange={(e) => onPayChange(e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('newGig.form.description.label')}
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={4}
          value={description || ''}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
    </>
  );
}
