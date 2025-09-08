import { Page } from '@playwright/test';
import '../types/global';

export interface TestGig {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  pay?: number;
  description?: string;
  startTime?: string;
  endTime?: string;
  isWholeDay?: boolean;
  memberAvailability?: Record<string, {
    status: 'available' | 'unavailable' | 'maybe';
    canDrive?: boolean;
    notes?: string;
  }>;
}

export interface TestBandMember {
  id: string;
  name: string;
  instrument: string;
}

/**
 * Mock gig data in the browser
 */
export async function mockGigs(page: Page, gigs: TestGig[]) {
  await page.evaluate((gigs) => {
    window.mockGigs = gigs;
  }, gigs);
}

/**
 * Mock band members data in the browser
 */
export async function mockBandMembers(page: Page, members: TestBandMember[]) {
  await page.evaluate((members) => {
    window.mockBandMembers = members;
  }, members);
}

/**
 * Mock instruments data in the browser
 */
export async function mockInstruments(page: Page, instruments: string[]) {
  await page.evaluate((instruments) => {
    window.mockInstruments = instruments;
  }, instruments);
}

/**
 * Create a sample gig for testing
 */
export function createSampleGig(overrides: Partial<TestGig> = {}): TestGig {
  return {
    id: 'sample-gig-1',
    name: 'Sample Concert',
    date: '2025-12-25',
    status: 'pending',
    location: 'City Hall',
    pay: 500,
    description: 'Christmas concert performance',
    startTime: '20:00',
    endTime: '23:00',
    isWholeDay: false,
    memberAvailability: {},
    ...overrides
  };
}

/**
 * Create sample band members for testing
 */
export function createSampleBandMembers(): TestBandMember[] {
  return [
    { id: 'member-1', name: 'John Guitar', instrument: 'Guitar' },
    { id: 'member-2', name: 'Jane Bass', instrument: 'Bass' },
    { id: 'member-3', name: 'Bob Drums', instrument: 'Drums' },
    { id: 'member-4', name: 'Alice Keys', instrument: 'Keyboard' },
  ];
}

/**
 * Create sample instruments for testing
 */
export function createSampleInstruments(): string[] {
  return ['Guitar', 'Bass', 'Drums', 'Keyboard', 'Saxophone', 'Trumpet', 'Violin'];
}

/**
 * Mock a complete dataset for testing
 */
export async function mockCompleteDataset(page: Page) {
  const gigs = [
    createSampleGig({ id: 'gig-1', name: 'Rock Concert', date: '2025-12-25', status: 'confirmed' }),
    createSampleGig({ id: 'gig-2', name: 'Jazz Evening', date: '2025-12-31', status: 'pending' }),
    createSampleGig({ id: 'gig-3', name: 'Wedding Gig', date: '2026-01-15', status: 'confirmed' }),
    createSampleGig({ 
      id: 'gig-4', 
      name: 'Festival Performance', 
      date: '2026-02-01', 
      status: 'completed',
      memberAvailability: {
        'member-1': { status: 'available', canDrive: true },
        'member-2': { status: 'available', canDrive: false },
        'member-3': { status: 'unavailable', canDrive: false },
        'member-4': { status: 'maybe', canDrive: true }
      }
    })
  ];
  
  const members = createSampleBandMembers();
  const instruments = createSampleInstruments();
  
  await mockGigs(page, gigs);
  await mockBandMembers(page, members);
  await mockInstruments(page, instruments);
}

/**
 * Clear all mock data
 */
export async function clearMockData(page: Page) {
  await page.evaluate(() => {
    delete window.mockGigs;
    delete window.mockBandMembers;
    delete window.mockInstruments;
  });
}

/**
 * Get future date for testing (X days from now)
 */
export function getFutureDate(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Get past date for testing (X days ago)
 */
export function getPastDate(daysAgo: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}