import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Gig } from '../types';
import { useGigs } from '../context/GigContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { sendEmail, getAllUserEmails } from '../utils/emailService';
import { getNewGigEmailTemplate } from '../utils/emailTemplates';

export function NewGig() {
  const navigate = useNavigate();
  const { addGig } = useGigs();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [formData, setFormData] = useState<Partial<Gig>>({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'pending',
    isWholeDay: false,
    isMultiDay: false,
    dates: [],
    location: '',
    distance: null,
    memberAvailability: {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name?.trim() || !formData.date) {
        throw new Error(t('newGig.errors.requiredFields'));
      }

      if (!user) {
        throw new Error(t('newGig.errors.loginRequired'));
      }

      const gigDate = new Date(formData.date);
      gigDate.setHours(23, 59, 59, 999);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (gigDate < today) {
        throw new Error(t('newGig.errors.pastDate'));
      }

      // Validate all dates if it's a multi-day gig
      if (formData.isMultiDay) {
        const allDates = [formData.date, ...(formData.dates || [])].filter(Boolean);
        for (const date of allDates) {
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          if (checkDate < today) {
            throw new Error(t('newGig.errors.pastDate'));
          }
        }
      }
      // Only validate time if it's not a multi-day gig
      else if (!formData.isWholeDay && formData.startTime && formData.endTime) {
        const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
        const [endHours, endMinutes] = formData.endTime.split(':').map(Number);

        if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
          throw new Error(t('newGig.errors.timeRange'));
        }
      }

      const gigData: Omit<Gig, 'id'> = {
        name: formData.name.trim(),
        date: formData.date,
        status: formData.status || 'pending',
        isWholeDay: formData.isMultiDay ? false : (formData.isWholeDay || false),
        isMultiDay: formData.isMultiDay,
        dates: formData.isMultiDay ? (formData.dates || []).filter(Boolean) : [],
        memberAvailability: {},
        startTime: (!formData.isMultiDay && !formData.isWholeDay) ? formData.startTime || null : null,
        endTime: (!formData.isMultiDay && !formData.isWholeDay) ? formData.endTime || null : null,
        location: formData.location?.trim() || null,
        distance: formData.distance || null,
        pay: formData.pay || null,
        description: formData.description?.trim() || null,
        createdBy: user.uid,
      };

      const newGigId = await addGig(gigData);

      if (sendEmailNotification) {
        try {
          const emails = await getAllUserEmails();

          if (emails.length > 0) {
            const gigLink = `${window.location.origin}/gigs/${newGigId}`;
            const template = getNewGigEmailTemplate(
              { name: gigData.name, date: gigData.date },
              gigLink
            );

            await sendEmail({
              to: emails,
              ...template,
            });
          }
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
      navigate('/gigs');
    } catch (error) {
      console.error('Error creating gig:', error);
      setError(error instanceof Error ? error.message : t('newGig.errors.createFailed'));
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/gigs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t('newGig.navigation.backToGigs')}
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('newGig.title')}</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('newGig.form.name.label')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('newGig.form.name.placeholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('newGig.form.multiDay.label')}
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isMultiDay"
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    checked={formData.isMultiDay}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isMultiDay: e.target.checked,
                      isWholeDay: false,
                      startTime: null,
                      endTime: null,
                    }))}
                  />
                  <label htmlFor="isMultiDay" className="ml-2 block text-sm text-gray-700">
                    {t('newGig.form.multiDay.checkbox')}
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-4 gap-6">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('newGig.form.location.label')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('newGig.form.location.placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.location || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('newGig.form.distance.label')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder={t('newGig.form.distance.placeholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.distance || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      distance: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                  />
                </div>
              </div>

              <div className={formData.isMultiDay ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.isMultiDay ? t('newGig.form.dates.label') : t('newGig.form.date.label')}
                </label>
                <div className="space-y-4">
                  <input
                    type="date"
                    required
                    min={today}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={formData.date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />

                  {formData.isMultiDay && (
                    <div className="space-y-4">
                      {formData.dates.map((date, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="date"
                            min={today}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={date}
                            onChange={(e) => {
                              const newDates = [...(formData.dates || [])];
                              newDates[index] = e.target.value;
                              setFormData(prev => ({ ...prev, dates: newDates }));
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newDates = formData.dates.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, dates: newDates }));
                            }}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            {t('newGig.form.dates.remove')}
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            dates: [...(prev.dates || []), '']
                          }));
                        }}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        {t('newGig.form.dates.addDate')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!formData.isMultiDay && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('newGig.form.wholeDay.label')}
                    </label>
                    <div className="flex items-center mt-2">
                      <input
                        type="checkbox"
                        id="isWholeDay"
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        checked={formData.isWholeDay}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          isWholeDay: e.target.checked,
                          startTime: e.target.checked ? null : prev.startTime,
                          endTime: e.target.checked ? null : prev.endTime,
                        }))}
                      />
                      <label htmlFor="isWholeDay" className="ml-2 block text-sm text-gray-700">
                        {t('newGig.form.wholeDay.checkbox')}
                      </label>
                    </div>
                  </div>

                  {!formData.isWholeDay && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('newGig.form.time.start')}
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={formData.startTime || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('newGig.form.time.end')}
                        </label>
                        <input
                          type="time"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={formData.endTime || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('newGig.form.pay.label')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.pay || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pay: e.target.value ? parseFloat(e.target.value) : null }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('newGig.form.description.label')}
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sendEmailNotification"
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                checked={sendEmailNotification}
                onChange={(e) => setSendEmailNotification(e.target.checked)}
              />
              <label htmlFor="sendEmailNotification" className="ml-2 block text-sm text-gray-700">
                {t('newGig.form.emailNotification.checkbox')}
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/gigs')}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('newGig.form.buttons.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {t('newGig.form.buttons.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}