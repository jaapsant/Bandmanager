import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export function EmailVerificationBanner() {
  const { user, sendVerificationEmail } = useAuth();
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await sendVerificationEmail();
      setSuccess(t('emailVerification.success'));
    } catch (error) {
      setError(t('emailVerification.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-100">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <p className="text-yellow-700">
              <span>{t('emailVerification.message')} </span>
              {error && <span className="text-red-600 ml-2">{error}</span>}
              {success && <span className="text-green-600 ml-2">{success}</span>}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleResend}
              disabled={sending}
              className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {sending ? t('emailVerification.sending') : t('emailVerification.resend')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}