import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    isDateInPast,
    isDateInPastStrict,
    isTimeRangeValid,
    validateMultiDayDates,
    validateSingleDayDate,
    validateGigTimeRange,
    validateRequiredFields,
    validateGig,
    ValidationMessages,
    GigValidationData
} from './gigValidation';

// Helper to create a date string for testing
const createDateString = (daysFromNow: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
};

// Default validation messages for testing
const mockMessages: ValidationMessages = {
    nameRequired: 'Name is required',
    dateRequired: 'Date is required',
    pastDate: 'Date cannot be in the past',
    changePastDate: 'Cannot change to a past date',
    emptyDates: 'All dates must be filled',
    timeRange: 'End time must be after start time',
};

describe('gigValidation', () => {
    describe('isDateInPast', () => {
        it('should return true for yesterday', () => {
            const yesterday = createDateString(-1);
            expect(isDateInPast(yesterday)).toBe(true);
        });

        it('should return false for tomorrow', () => {
            const tomorrow = createDateString(1);
            expect(isDateInPast(tomorrow)).toBe(false);
        });

        it('should return false for today (uses end-of-day comparison)', () => {
            const today = createDateString(0);
            expect(isDateInPast(today)).toBe(false);
        });

        it('should return true for dates far in the past', () => {
            const pastDate = '2020-01-01';
            expect(isDateInPast(pastDate)).toBe(true);
        });

        it('should return false for dates far in the future', () => {
            const futureDate = '2030-12-31';
            expect(isDateInPast(futureDate)).toBe(false);
        });
    });

    describe('isDateInPastStrict', () => {
        it('should return true for yesterday', () => {
            const yesterday = createDateString(-1);
            expect(isDateInPastStrict(yesterday)).toBe(true);
        });

        it('should return false for tomorrow', () => {
            const tomorrow = createDateString(1);
            expect(isDateInPastStrict(tomorrow)).toBe(false);
        });

        it('should return false for today (uses start-of-day comparison)', () => {
            const today = createDateString(0);
            expect(isDateInPastStrict(today)).toBe(false);
        });
    });

    describe('isTimeRangeValid', () => {
        it('should return true when end time is after start time', () => {
            expect(isTimeRangeValid('09:00', '17:00')).toBe(true);
            expect(isTimeRangeValid('19:00', '22:30')).toBe(true);
            expect(isTimeRangeValid('00:00', '23:59')).toBe(true);
        });

        it('should return false when end time is before start time', () => {
            expect(isTimeRangeValid('17:00', '09:00')).toBe(false);
            expect(isTimeRangeValid('22:30', '19:00')).toBe(false);
        });

        it('should return false when end time equals start time', () => {
            expect(isTimeRangeValid('12:00', '12:00')).toBe(false);
        });

        it('should return false when same hour but end minutes before start minutes', () => {
            expect(isTimeRangeValid('14:30', '14:15')).toBe(false);
        });

        it('should return true when same hour but end minutes after start minutes', () => {
            expect(isTimeRangeValid('14:15', '14:30')).toBe(true);
        });
    });

    describe('validateMultiDayDates', () => {
        it('should return valid for all future dates', () => {
            const tomorrow = createDateString(1);
            const dayAfter = createDateString(2);
            const result = validateMultiDayDates(tomorrow, [dayAfter], mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid when additional dates array has empty string', () => {
            const tomorrow = createDateString(1);
            const result = validateMultiDayDates(tomorrow, ['', createDateString(2)], mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.emptyDates);
        });

        it('should return invalid when primary date is in the past', () => {
            const yesterday = createDateString(-1);
            const tomorrow = createDateString(1);
            const result = validateMultiDayDates(yesterday, [tomorrow], mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.pastDate);
        });

        it('should return invalid when any additional date is in the past', () => {
            const tomorrow = createDateString(1);
            const yesterday = createDateString(-1);
            const result = validateMultiDayDates(tomorrow, [yesterday], mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.pastDate);
        });

        it('should return valid with empty additional dates array', () => {
            const tomorrow = createDateString(1);
            const result = validateMultiDayDates(tomorrow, [], mockMessages);
            expect(result.valid).toBe(true);
        });
    });

    describe('validateSingleDayDate', () => {
        it('should return valid for future date', () => {
            const tomorrow = createDateString(1);
            const result = validateSingleDayDate(tomorrow, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return valid for today', () => {
            const today = createDateString(0);
            const result = validateSingleDayDate(today, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid for past date', () => {
            const yesterday = createDateString(-1);
            const result = validateSingleDayDate(yesterday, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.pastDate);
        });
    });

    describe('validateGigTimeRange', () => {
        it('should return valid for whole-day gig regardless of times', () => {
            const result = validateGigTimeRange('17:00', '09:00', true, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return valid when no start time', () => {
            const result = validateGigTimeRange(null, '17:00', false, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return valid when no end time', () => {
            const result = validateGigTimeRange('09:00', null, false, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return valid for valid time range', () => {
            const result = validateGigTimeRange('09:00', '17:00', false, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid for invalid time range', () => {
            const result = validateGigTimeRange('17:00', '09:00', false, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.timeRange);
        });
    });

    describe('validateRequiredFields', () => {
        it('should return valid when name and date are provided', () => {
            const gigData: GigValidationData = { name: 'Test Gig', date: '2024-03-15' };
            const result = validateRequiredFields(gigData, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid when name is missing', () => {
            const gigData: GigValidationData = { date: '2024-03-15' };
            const result = validateRequiredFields(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.nameRequired);
        });

        it('should return invalid when name is empty string', () => {
            const gigData: GigValidationData = { name: '', date: '2024-03-15' };
            const result = validateRequiredFields(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.nameRequired);
        });

        it('should return invalid when name is only whitespace', () => {
            const gigData: GigValidationData = { name: '   ', date: '2024-03-15' };
            const result = validateRequiredFields(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.nameRequired);
        });

        it('should return invalid when date is missing', () => {
            const gigData: GigValidationData = { name: 'Test Gig' };
            const result = validateRequiredFields(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.dateRequired);
        });

        it('should return invalid when date is empty string', () => {
            const gigData: GigValidationData = { name: 'Test Gig', date: '' };
            const result = validateRequiredFields(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.dateRequired);
        });
    });

    describe('validateGig', () => {
        it('should return valid for a complete valid gig', () => {
            const tomorrow = createDateString(1);
            const gigData: GigValidationData = {
                name: 'Test Gig',
                date: tomorrow,
                isMultiDay: false,
                isWholeDay: false,
                startTime: '19:00',
                endTime: '22:00',
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid when name is missing', () => {
            const tomorrow = createDateString(1);
            const gigData: GigValidationData = {
                date: tomorrow,
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.nameRequired);
        });

        it('should return invalid when date is in the past', () => {
            const yesterday = createDateString(-1);
            const gigData: GigValidationData = {
                name: 'Test Gig',
                date: yesterday,
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.pastDate);
        });

        it('should return valid for whole-day gig without times', () => {
            const tomorrow = createDateString(1);
            const gigData: GigValidationData = {
                name: 'Test Gig',
                date: tomorrow,
                isWholeDay: true,
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid for invalid time range', () => {
            const tomorrow = createDateString(1);
            const gigData: GigValidationData = {
                name: 'Test Gig',
                date: tomorrow,
                isWholeDay: false,
                startTime: '22:00',
                endTime: '19:00',
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.timeRange);
        });

        it('should return valid for multi-day gig with all future dates', () => {
            const tomorrow = createDateString(1);
            const dayAfter = createDateString(2);
            const gigData: GigValidationData = {
                name: 'Test Festival',
                date: tomorrow,
                isMultiDay: true,
                dates: [dayAfter],
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(true);
        });

        it('should return invalid for multi-day gig with past dates', () => {
            const yesterday = createDateString(-1);
            const tomorrow = createDateString(1);
            const gigData: GigValidationData = {
                name: 'Test Festival',
                date: yesterday,
                isMultiDay: true,
                dates: [tomorrow],
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.pastDate);
        });

        it('should return invalid for multi-day gig with empty date strings', () => {
            const tomorrow = createDateString(1);
            const gigData: GigValidationData = {
                name: 'Test Festival',
                date: tomorrow,
                isMultiDay: true,
                dates: [''],
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(false);
            expect(result.error).toBe(mockMessages.emptyDates);
        });

        // Tests for editing existing gigs (originalDate parameter)
        describe('when editing existing gig', () => {
            it('should allow keeping the same past date when editing', () => {
                const yesterday = createDateString(-1);
                const gigData: GigValidationData = {
                    name: 'Test Gig',
                    date: yesterday,
                };
                // Original date is the same as new date
                const result = validateGig(gigData, mockMessages, yesterday);
                expect(result.valid).toBe(true);
            });

            it('should not allow changing to a different past date when editing', () => {
                const yesterday = createDateString(-1);
                const twoDaysAgo = createDateString(-2);
                const gigData: GigValidationData = {
                    name: 'Test Gig',
                    date: twoDaysAgo,
                };
                // Original date is different from new date
                const result = validateGig(gigData, mockMessages, yesterday);
                expect(result.valid).toBe(false);
                expect(result.error).toBe(mockMessages.changePastDate);
            });

            it('should allow changing to a future date when editing', () => {
                const yesterday = createDateString(-1);
                const tomorrow = createDateString(1);
                const gigData: GigValidationData = {
                    name: 'Test Gig',
                    date: tomorrow,
                };
                const result = validateGig(gigData, mockMessages, yesterday);
                expect(result.valid).toBe(true);
            });
        });

        // Test that multi-day gigs don't validate time range
        it('should not validate time range for multi-day gigs', () => {
            const tomorrow = createDateString(1);
            const dayAfter = createDateString(2);
            const gigData: GigValidationData = {
                name: 'Test Festival',
                date: tomorrow,
                isMultiDay: true,
                dates: [dayAfter],
                // Invalid time range, but should be ignored for multi-day
                startTime: '22:00',
                endTime: '19:00',
            };
            const result = validateGig(gigData, mockMessages);
            expect(result.valid).toBe(true);
        });
    });
});
