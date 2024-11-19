import React, { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Gig } from '../types';
import { generateCalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '../utils/calendar';

interface AddToCalendarProps {
  gig: Gig;
}

export function AddToCalendar({ gig }: AddToCalendarProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [error, setError] = useState('');

  const downloadIcs = async () => {
    try {
      const icsContent = await generateCalendarEvent(gig);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `${gig.name.replace(/\s+/g, '-')}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating calendar event:', error);
      setError('Failed to generate calendar event');
    }
  };

  if (gig.status === 'declined' || gig.status === 'completed') {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="flex items-center text-gray-600 hover:text-gray-900"
        title="Add to calendar"
      >
        <CalendarPlus className="w-5 h-5" />
      </button>

      {showOptions && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          {error && (
            <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
              {error}
            </div>
          )}
          <div className="py-1">
            <button
              onClick={() => {
                window.open(generateGoogleCalendarUrl(gig), '_blank');
                setShowOptions(false);
              }}
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
            >
              Google Calendar
            </button>
            <button
              onClick={() => {
                window.open(generateOutlookCalendarUrl(gig), '_blank');
                setShowOptions(false);
              }}
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
            >
              Outlook Calendar
            </button>
            <button
              onClick={() => {
                downloadIcs();
                setShowOptions(false);
              }}
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
            >
              Download .ics file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}