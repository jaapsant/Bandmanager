import { TFunction } from 'i18next';

interface InstrumentUpdateCardProps {
  selectedInstrument: string;
  onInstrumentChange: (instrument: string) => void;
  instruments: string[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  t: TFunction;
}

export function InstrumentUpdateCard({
  selectedInstrument,
  onInstrumentChange,
  instruments,
  onSubmit,
  loading,
  t,
}: InstrumentUpdateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('profile.sections.instrument.title')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.sections.instrument.label')}
          </label>
          <select
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={selectedInstrument}
            onChange={(e) => onInstrumentChange(e.target.value)}
          >
            <option value="">{t('profile.sections.instrument.placeholder')}</option>
            {instruments.map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {t('profile.sections.instrument.button')}
          </button>
        </div>
      </form>
    </div>
  );
}
