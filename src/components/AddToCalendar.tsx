import { useState, useRef, useEffect } from 'react';
import { CalendarPlus } from 'lucide-react';
import { Gig } from '../types';
import { generateCalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '../utils/calendar';

interface AddToCalendarProps {
  gig: Gig;
}

export function AddToCalendar({ gig }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-700"
      >
        <CalendarPlus className="w-4 h-4" />
      </button>

      {isOpen && (
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
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
            >
              Google Calendar
            </button>
            <button
              onClick={() => {
                window.open(generateOutlookCalendarUrl(gig), '_blank');
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
            >
              Outlook Calendar
            </button>
            <button
              onClick={() => {
                downloadIcs();
                setIsOpen(false);
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