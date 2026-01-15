import { TFunction } from 'i18next';

interface PasswordUpdateCardProps {
  currentPassword: string;
  onCurrentPasswordChange: (password: string) => void;
  newPassword: string;
  onNewPasswordChange: (password: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  t: TFunction;
}

export function PasswordUpdateCard({
  currentPassword,
  onCurrentPasswordChange,
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  onSubmit,
  loading,
  t,
}: PasswordUpdateCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {t('profile.sections.password.title')}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.sections.password.currentPassword')}
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={currentPassword}
            onChange={(e) => onCurrentPasswordChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.sections.password.newPassword')}
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('profile.sections.password.confirmPassword')}
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {t('profile.sections.password.button')}
          </button>
        </div>
      </form>
    </div>
  );
}
