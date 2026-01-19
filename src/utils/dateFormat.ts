const LOCALE = 'nl-NL';

/**
 * Formats a date string or Date object to a full date string (e.g., "15 januari 2024")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE);
}

/**
 * Formats a date to short format (e.g., "15 jan")
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' });
}

/**
 * Formats a date with weekday (e.g., "maandag 15 januari 2024")
 */
export function formatDateWithWeekday(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Formats a number as currency in euros (e.g., "€ 123,45")
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString(LOCALE, { style: 'currency', currency: 'EUR' });
}
