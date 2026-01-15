import { TFunction } from 'i18next';

interface SheetMusicCardProps {
  wantsPrintedSheetMusic: boolean;
  onWantsPrintedChange: (wants: boolean) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  t: TFunction;
}

export function SheetMusicCard({
  wantsPrintedSheetMusic,
  onWantsPrintedChange,
  onSubmit,
  loading,
  t,
}: SheetMusicCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('profile.sections.sheetMusic.title')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="wantsPrintedSheetMusic"
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            checked={wantsPrintedSheetMusic}
            onChange={(e) => onWantsPrintedChange(e.target.checked)}
          />
          <label
            htmlFor="wantsPrintedSheetMusic"
            className="ml-2 text-sm font-medium text-gray-700"
          >
            {t('profile.sections.sheetMusic.label')}
          </label>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {t('profile.sections.sheetMusic.button')}
          </button>
        </div>
      </form>
    </div>
  );
}
