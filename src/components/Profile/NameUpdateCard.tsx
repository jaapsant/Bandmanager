import { TFunction } from 'i18next';

interface NameUpdateCardProps {
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  t: TFunction;
}

export function NameUpdateCard({
  name,
  onNameChange,
  onSubmit,
  loading,
  t,
}: NameUpdateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('profile.sections.name.title')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.sections.name.label')}
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {t('profile.sections.name.button')}
          </button>
        </div>
      </form>
    </div>
  );
}
