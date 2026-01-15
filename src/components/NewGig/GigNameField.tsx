import { TFunction } from 'i18next';

interface GigNameFieldProps {
  name: string;
  onNameChange: (name: string) => void;
  t: TFunction;
}

export function GigNameField({ name, onNameChange, t }: GigNameFieldProps) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('newGig.form.name.label')}
      </label>
      <input
        type="text"
        required
        placeholder={t('newGig.form.name.placeholder')}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />
    </div>
  );
}
