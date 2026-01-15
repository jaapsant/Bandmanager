import { FileText } from 'lucide-react';
import { TFunction } from 'i18next';
import { SheetMusicSummaryItem } from '../../hooks/useBandMembers';

interface SheetMusicSummaryCardProps {
  sheetMusicSummary: SheetMusicSummaryItem[];
  totalWantsPrinted: number;
  totalMembers: number;
  t: TFunction;
}

export function SheetMusicSummaryCard({
  sheetMusicSummary,
  totalWantsPrinted,
  totalMembers,
  t,
}: SheetMusicSummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-4">
        <FileText className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">{t('bandMembers.sheetMusic.title')}</h3>
      </div>
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {t('bandMembers.sheetMusic.total', { count: totalWantsPrinted, total: totalMembers })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          {sheetMusicSummary.map(({ instrument, wantsPrinted, total }) => (
            <div key={instrument} className="text-sm text-gray-600 bg-blue-50 rounded px-3 py-2">
              <span className="font-medium">{instrument}:</span> {wantsPrinted}/{total}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
