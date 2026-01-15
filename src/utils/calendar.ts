import { createEvent } from 'ics';
import { Gig } from '../types';

/**
 * Maps gig status to valid iCal status values.
 * iCal only supports: TENTATIVE, CANCELLED, CONFIRMED
 */
function mapGigStatusToICalStatus(status: Gig['status']): 'TENTATIVE' | 'CANCELLED' | 'CONFIRMED' {
  switch (status) {
    case 'pending':
      return 'TENTATIVE';
    case 'declined':
      return 'CANCELLED';
    case 'confirmed':
    case 'completed':
      return 'CONFIRMED';
    default:
      return 'TENTATIVE';
  }
}

export function generateCalendarEvent(gig: Gig) {
  const gigDate = new Date(gig.date);
  const year = gigDate.getFullYear();
  const month = gigDate.getMonth() + 1;
  const day = gigDate.getDate();

  let startTime: number[] = [year, month, day];
  let endTime: number[] = [year, month, day];

  if (!gig.isWholeDay && gig.startTime && gig.endTime) {
    const [startHour, startMinute] = gig.startTime.split(':').map(Number);
    const [endHour, endMinute] = gig.endTime.split(':').map(Number);
    startTime = [...startTime, startHour, startMinute];
    endTime = [...endTime, endHour, endMinute];
  }

  const description = [
    gig.description,
    gig.pay ? `Pay: $${gig.pay}` : null,
    'Status: ' + gig.status.charAt(0).toUpperCase() + gig.status.slice(1),
  ].filter(Boolean).join('\n\n');

  const event = {
    start: startTime,
    end: endTime,
    title: gig.name,
    description,
    location: gig.location || '',
    status: mapGigStatusToICalStatus(gig.status),
    busyStatus: 'BUSY' as const,
  };

  return new Promise<string>((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) {
        reject(error);
      }
      resolve(value);
    });
  });
}

export function generateGoogleCalendarUrl(gig: Gig) {
  const gigDate = new Date(gig.date);
  let startDate: string;
  let endDate: string;

  if (gig.isWholeDay) {
    startDate = gigDate.toISOString().split('T')[0].replace(/-/g, '');
    const nextDay = new Date(gigDate);
    nextDay.setDate(nextDay.getDate() + 1);
    endDate = nextDay.toISOString().split('T')[0].replace(/-/g, '');
  } else if (gig.startTime && gig.endTime) {
    const [startHour, startMinute] = gig.startTime.split(':');
    const [endHour, endMinute] = gig.endTime.split(':');
    
    const startDateTime = new Date(gigDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
    
    const endDateTime = new Date(gigDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
    
    startDate = startDateTime.toISOString().replace(/-|:|\.\d{3}/g, '');
    endDate = endDateTime.toISOString().replace(/-|:|\.\d{3}/g, '');
  } else {
    startDate = gigDate.toISOString().split('T')[0].replace(/-/g, '');
    const nextDay = new Date(gigDate);
    nextDay.setDate(nextDay.getDate() + 1);
    endDate = nextDay.toISOString().split('T')[0].replace(/-/g, '');
  }

  const details = [
    gig.description,
    gig.pay ? `Pay: $${gig.pay}` : null,
    'Status: ' + gig.status.charAt(0).toUpperCase() + gig.status.slice(1),
  ].filter(Boolean).join('\n\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: gig.name,
    dates: `${startDate}/${endDate}`,
    details: details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(gig: Gig) {
  const gigDate = new Date(gig.date);
  let startDate: string;
  let endDate: string;

  if (gig.isWholeDay) {
    startDate = gigDate.toISOString().split('T')[0];
    const nextDay = new Date(gigDate);
    nextDay.setDate(nextDay.getDate() + 1);
    endDate = nextDay.toISOString().split('T')[0];
  } else if (gig.startTime && gig.endTime) {
    const [startHour, startMinute] = gig.startTime.split(':');
    const [endHour, endMinute] = gig.endTime.split(':');
    
    const startDateTime = new Date(gigDate);
    startDateTime.setHours(parseInt(startHour), parseInt(startMinute));
    
    const endDateTime = new Date(gigDate);
    endDateTime.setHours(parseInt(endHour), parseInt(endMinute));
    
    startDate = startDateTime.toISOString().replace(/\.\d{3}Z$/, 'Z');
    endDate = endDateTime.toISOString().replace(/\.\d{3}Z$/, 'Z');
  } else {
    startDate = gigDate.toISOString().split('T')[0];
    const nextDay = new Date(gigDate);
    nextDay.setDate(nextDay.getDate() + 1);
    endDate = nextDay.toISOString().split('T')[0];
  }

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: startDate,
    enddt: endDate,
    subject: gig.name,
    body: [
      gig.description,
      gig.pay ? `Pay: $${gig.pay}` : null,
      'Status: ' + gig.status.charAt(0).toUpperCase() + gig.status.slice(1),
    ].filter(Boolean).join('\n\n'),
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}