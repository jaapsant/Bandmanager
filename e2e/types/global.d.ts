import { TestGig, TestBandMember } from '../helpers/data-helpers';

declare global {
  interface Window {
    mockGigs?: TestGig[];
    mockBandMembers?: TestBandMember[];
    mockInstruments?: string[];
  }
}