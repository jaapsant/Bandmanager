import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Music } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, resetPassword } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Get the redirect path from location state, default to /gigs
  const from = (location.state as { from?: string })?.from || '/gigs';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Redirect to the intended destination or /gigs
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(t('signIn.errors.default'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(t('signIn.errors.default'));
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowResetForm(false);
    setResetSuccess(false);
    setResetEmail('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Music className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {showResetForm ? t('signIn.forgotPassword.title') : t('signIn.title')}
        </h2>
        {!showResetForm && (
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('signIn.createAccount.prefix')}{' '}
            <Link to="/signup" className="font-medium text-red-600 hover:text-red-500">
              {t('signIn.createAccount.link')}
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!showResetForm ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('signIn.form.email.label')}
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('signIn.form.password.label')}
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    {t('signIn.forgotPassword.link')}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? t('signIn.form.submit.loading') : t('signIn.form.submit.default')}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {resetSuccess ? (
                <div>
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm mb-4">
                    {t('signIn.forgotPassword.success')}
                  </div>
                  <button
                    onClick={handleBackToSignIn}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {t('signIn.forgotPassword.backToSignIn')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <p className="text-sm text-gray-600">
                    {t('signIn.forgotPassword.description')}
                  </p>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                      {t('signIn.forgotPassword.emailLabel')}
                    </label>
                    <div className="mt-1">
                      <input
                        id="reset-email"
                        name="reset-email"
                        type="email"
                        autoComplete="email"
                        required
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleBackToSignIn}
                      className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {t('signIn.forgotPassword.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {resetLoading ? t('signIn.form.submit.loading') : t('signIn.forgotPassword.submit')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}