import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCalendarEvent, generateGoogleCalendarUrl, generateOutlookCalendarUrl } from './calendar';
import { Gig } from '../types';

// Mock the ics module
vi.mock('ics', () => ({
  createEvent: vi.fn(),
}));

const mockCreateEvent = vi.mocked((await import('ics')).createEvent);

describe('calendar utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockGig = (overrides: any = {}): any => ({
    id: '1',
    name: 'Test Gig',
    date: '2024-03-15',
    startTime: '19:00',
    endTime: '22:00',
    status: 'confirmed', // Using string to match what the calendar utils expect
    isWholeDay: false,
    isMultiDay: false,
    dates: ['2024-03-15'],
    location: 'Test Venue',
    distance: 10,
    pay: 500,
    description: 'Test gig description',
    memberAvailability: {},
    createdBy: 'user123',
    ...overrides,
  });

  describe('generateCalendarEvent', () => {
    it('should create calendar event for timed gig', async () => {
      const mockGig = createMockGig();
      mockCreateEvent.mockImplementation((event, callback) => {
        callback(null, 'mocked-ics-content');
      });

      const result = await generateCalendarEvent(mockGig);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          start: [2024, 3, 15, 19, 0],
          end: [2024, 3, 15, 22, 0],
          title: 'Test Gig',
          description: expect.stringContaining('Test gig description'),
          status: expect.any(String),
          busyStatus: 'BUSY',
        }),
        expect.any(Function)
      );
      expect(result).toBe('mocked-ics-content');
    });

    it('should create calendar event for whole day gig', async () => {
      const mockGig = createMockGig({
        isWholeDay: true,
        startTime: null,
        endTime: null,
      });
      mockCreateEvent.mockImplementation((event, callback) => {
        callback(null, 'mocked-ics-content');
      });

      await generateCalendarEvent(mockGig);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          start: [2024, 3, 15],
          end: [2024, 3, 15],
          title: 'Test Gig',
        }),
        expect.any(Function)
      );
    });

    it('should include pay information in description', async () => {
      const mockGig = createMockGig({ pay: 750 });
      mockCreateEvent.mockImplementation((event, callback) => {
        callback(null, 'mocked-ics-content');
      });

      await generateCalendarEvent(mockGig);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('Pay: $750'),
        }),
        expect.any(Function)
      );
    });

    it('should handle creation error', async () => {
      const mockGig = createMockGig();
      const error = new Error('Creation failed');
      mockCreateEvent.mockImplementation((event, callback) => {
        callback(error, null);
      });

      await expect(generateCalendarEvent(mockGig)).rejects.toThrow('Creation failed');
    });
  });

  describe('generateGoogleCalendarUrl', () => {
    it('should generate correct URL for timed gig', () => {
      const mockGig = createMockGig();
      
      const result = generateGoogleCalendarUrl(mockGig);
      const url = new URL(result);
      const params = new URLSearchParams(url.search);

      expect(url.hostname).toBe('calendar.google.com');
      expect(params.get('action')).toBe('TEMPLATE');
      expect(params.get('text')).toBe('Test Gig');
      expect(params.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
      expect(params.get('details')).toContain('Test gig description');
      expect(params.get('details')).toContain('Pay: $500');
    });

    it('should generate correct URL for whole day gig', () => {
      const mockGig = createMockGig({
        isWholeDay: true,
        startTime: null,
        endTime: null,
      });
      
      const result = generateGoogleCalendarUrl(mockGig);
      const url = new URL(result);
      const params = new URLSearchParams(url.search);

      expect(params.get('dates')).toMatch(/^\d{8}\/\d{8}$/);
    });

    it('should handle gig without pay', () => {
      const mockGig = createMockGig({ pay: null });
      
      const result = generateGoogleCalendarUrl(mockGig);
      const url = new URL(result);
      const params = new URLSearchParams(url.search);

      expect(params.get('details')).not.toContain('Pay:');
      expect(params.get('details')).toContain('Test gig description');
    });
  });

  describe('generateOutlookCalendarUrl', () => {
    it('should generate correct URL for timed gig', () => {
      const mockGig = createMockGig();
      
      const result = generateOutlookCalendarUrl(mockGig);
      const url = new URL(result);
      const params = new URLSearchParams(url.search);

      expect(url.hostname).toBe('outlook.office.com');
      expect(params.get('path')).toBe('/calendar/action/compose');
      expect(params.get('rru')).toBe('addevent');
      expect(params.get('subject')).toBe('Test Gig');
      expect(params.get('startdt')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      expect(params.get('enddt')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    it('should generate correct URL for whole day gig', () => {
      const mockGig = createMockGig({
        isWholeDay: true,
        startTime: null,
        endTime: null,
      });
      
      const result = generateOutlookCalendarUrl(mockGig);
      const url = new URL(result);
      const params = new URLSearchParams(url.search);

      expect(params.get('startdt')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(params.get('enddt')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should include all details in body', () => {
      const mockGig = createMockGig();
      
      const result = generateOutlookCalendarUrl(mockGig);
      const url = new URL(result);
      const params = new URLSearchParams(url.search);
      const body = params.get('body');

      expect(body).toContain('Test gig description');
      expect(body).toContain('Pay: $500');
      expect(body).toContain('Status: Confirmed');
    });
  });
});