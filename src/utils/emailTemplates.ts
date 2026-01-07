import { Gig } from '../types';

/**
 * Email template for new gig notifications
 */
export function getNewGigEmailTemplate(gig: {
  name: string;
  date: string;
}, gigLink: string) {
  return {
    subject: `Nieuw optreden: ${gig.name}`,
    text: `Er is een nieuw optreden aangemaakt: "${gig.name}" op ${gig.date}.\n\nVoer alsjeblieft je beschikbaarheid in: ${gigLink}`,
    html: `
      <p>Er is een nieuw optreden aangemaakt: "<strong>${gig.name}</strong>" op ${gig.date}.</p>
      <p><a href="${gigLink}">Voer hier je beschikbaarheid in</a></p>
    `,
  };
}

/**
 * Email template for gig availability reminders
 */
export function getGigReminderEmailTemplate(gig: Gig, gigLink: string) {
  return {
    subject: `Graag invullen: Beschikbaarheid voor ${gig.name}`,
    text: `Graag je beschikbaarheid invullen voor het optreden "${gig.name}" op ${gig.date}.\n\nLink: ${gigLink}`,
    html: `
      <p>Graag je beschikbaarheid invullen voor het optreden "<strong>${gig.name}</strong>" op ${gig.date}.</p>
      <p><a href="${gigLink}">Klik hier om het optreden te zien</a></p>
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
