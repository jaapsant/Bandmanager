import { TFunction } from 'i18next';

interface GigFormActionsProps {
  sendEmailNotification: boolean;
  onSendEmailNotificationChange: (send: boolean) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  t: TFunction;
}

export function GigFormActions({
  sendEmailNotification,
  onSendEmailNotificationChange,
  isSubmitting,
  onCancel,
  t,
}: GigFormActionsProps) {
  return (
    <>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="sendEmailNotification"
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          checked={sendEmailNotification}
          onChange={(e) => onSendEmailNotificationChange(e.target.checked)}
        />
        <label htmlFor="sendEmailNotification" className="ml-2 block text-sm text-gray-700">
          {t('newGig.form.emailNotification.checkbox')}
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('newGig.form.buttons.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('newGig.form.buttons.creating') : t('newGig.form.buttons.create')}
        </button>
      </div>
    </>
  );
}
