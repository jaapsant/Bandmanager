/**
 * Gig validation utility functions.
 * Consolidates date and time validation logic used across the application.
 */

export interface GigValidationData {
    name?: string;
    date?: string;
    dates?: string[];
    isMultiDay?: boolean;
    isWholeDay?: boolean;
    startTime?: string | null;
    endTime?: string | null;
}

export interface ValidationMessages {
    nameRequired: string;
    dateRequired: string;
    pastDate: string;
    changePastDate: string;
    emptyDates: string;
    timeRange: string;
}

/**
 * Checks if a date string represents a past date.
 * Sets time to end of day for the check date and start of day for today.
 */
export function isDateInPast(dateString: string): boolean {
    const checkDate = new Date(dateString);
    checkDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
}

/**
 * Checks if a date string represents a past date using start-of-day comparison.
 * Used for multi-day gig validation where we compare at midnight.
 */
export function isDateInPastStrict(dateString: string): boolean {
    const checkDate = new Date(dateString);
    checkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
}

/**
 * Validates that the end time is after the start time.
 * Returns true if valid, false if end time is before or equal to start time.
 */
export function isTimeRangeValid(startTime: string, endTime: string): boolean {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    if (startHours > endHours) return false;
    if (startHours === endHours && startMinutes >= endMinutes) return false;
    return true;
}

/**
 * Validates all dates in a multi-day gig.
 * Returns an object with validation result and any error.
 */
export function validateMultiDayDates(
    primaryDate: string,
    additionalDates: string[],
    messages: Pick<ValidationMessages, 'emptyDates' | 'pastDate'>
): { valid: boolean; error?: string } {
    // Check for empty dates in the additional dates array
    if (additionalDates.some(date => !date)) {
        return { valid: false, error: messages.emptyDates };
    }

    // Validate all dates (primary + additional)
    const allDates = [primaryDate, ...additionalDates].filter(Boolean);
    for (const date of allDates) {
        if (isDateInPastStrict(date)) {
            return { valid: false, error: messages.pastDate };
        }
    }

    return { valid: true };
}

/**
 * Validates a single-day gig's date.
 */
export function validateSingleDayDate(
    date: string,
    messages: Pick<ValidationMessages, 'pastDate'>
): { valid: boolean; error?: string } {
    if (isDateInPast(date)) {
        return { valid: false, error: messages.pastDate };
    }
    return { valid: true };
}

/**
 * Validates a gig's time range (only for non-whole-day gigs).
 */
export function validateGigTimeRange(
    startTime: string | null | undefined,
    endTime: string | null | undefined,
    isWholeDay: boolean,
    messages: Pick<ValidationMessages, 'timeRange'>
): { valid: boolean; error?: string } {
    if (isWholeDay || !startTime || !endTime) {
        return { valid: true };
    }

    if (!isTimeRangeValid(startTime, endTime)) {
        return { valid: false, error: messages.timeRange };
    }

    return { valid: true };
}

/**
 * Validates required fields for a gig.
 */
export function validateRequiredFields(
    gigData: GigValidationData,
    messages: Pick<ValidationMessages, 'nameRequired' | 'dateRequired'>
): { valid: boolean; error?: string } {
    if (!gigData.name?.trim()) {
        return { valid: false, error: messages.nameRequired };
    }
    if (!gigData.date) {
        return { valid: false, error: messages.dateRequired };
    }
    return { valid: true };
}

/**
 * Comprehensive gig validation function.
 * Validates all aspects of a gig: required fields, dates, and times.
 *
 * @param gigData - The gig data to validate
 * @param messages - Validation error messages (i18n)
 * @param originalDate - If editing, the original date to allow keeping a past date unchanged
 * @returns Object with valid flag and optional error message
 */
export function validateGig(
    gigData: GigValidationData,
    messages: ValidationMessages,
    originalDate?: string
): { valid: boolean; error?: string } {
    // Validate required fields
    const requiredCheck = validateRequiredFields(gigData, messages);
    if (!requiredCheck.valid) return requiredCheck;

    // Validate dates
    if (gigData.isMultiDay && gigData.dates) {
        const multiDayCheck = validateMultiDayDates(
            gigData.date!,
            gigData.dates,
            messages
        );
        if (!multiDayCheck.valid) return multiDayCheck;
    } else {
        // For single-day gigs, check if date is in the past
        // Allow keeping the same date when editing
        if (originalDate) {
            const originalDateTime = new Date(originalDate).getTime();
            const newDateTime = new Date(gigData.date!).getTime();
            // Only validate if the date has changed
            if (originalDateTime !== newDateTime && isDateInPast(gigData.date!)) {
                return { valid: false, error: messages.changePastDate };
            }
        } else if (isDateInPast(gigData.date!)) {
            return { valid: false, error: messages.pastDate };
        }
    }

    // Validate time range (only for non-multi-day, non-whole-day gigs)
    if (!gigData.isMultiDay) {
        const timeCheck = validateGigTimeRange(
            gigData.startTime,
            gigData.endTime,
            gigData.isWholeDay || false,
            messages
        );
        if (!timeCheck.valid) return timeCheck;
    }

    return { valid: true };
}
