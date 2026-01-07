import { Gig } from '../types';

/**
 * Email template for new gig notifications
 */
export function getNewGigEmailTemplate(gig: {
  name: string;
  date: string;
}, gigLink: string) {
  return {
    subject: `New Gig: ${gig.name}`,
    text: `A new gig has been created: "${gig.name}" on ${gig.date}.\n\nPlease add your availability: ${gigLink}`,
    html: `
      <p>A new gig has been created: "<strong>${gig.name}</strong>" on ${gig.date}.</p>
      <p><a href="${gigLink}">Click here to add your availability</a></p>
    `,
  };
}

/**
 * Email template for gig availability reminders
 */
export function getGigReminderEmailTemplate(gig: Gig, gigLink: string) {
  return {
    subject: `Action Required: Availability for ${gig.name}`,
    text: `Please add your availability for the gig "${gig.name}" on ${gig.date}.\n\nLink: ${gigLink}`,
    html: `
      <p>Please add your availability for the gig "<strong>${gig.name}</strong>" on ${gig.date}.</p>
      <p><a href="${gigLink}">Click here to view the gig</a></p>
    `,
  };
}

/**
 * Future email templates can be added here following the same pattern:
 *
 * export function getGigCancellationEmailTemplate(gig: Gig) { ... }
 * export function getGigUpdateEmailTemplate(gig: Gig, changes: string) { ... }
 * export function getWelcomeEmailTemplate(userName: string) { ... }
 * etc.
 */
