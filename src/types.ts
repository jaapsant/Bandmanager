export interface GigStatus {
  value: 'pending' | 'confirmed' | 'declined' | 'completed';
  label: string;
  color: string;
}

export type AvailabilityStatusValue = 'available' | 'unavailable' | 'maybe';

export interface AvailabilityStatus {
  value: AvailabilityStatusValue;
  label: 'gigs.available' | 'gigs.unavailable' | 'gigs.maybe';
}

export interface DateAvailability {
  status: AvailabilityStatusValue;
  note?: string;
  canDrive?: boolean | null;
}

export interface MemberAvailability {
  status: AvailabilityStatusValue;
  note?: string;
  canDrive?: boolean | null;
  dateAvailability: {
    [date: string]: DateAvailability;
  };
}

export interface BandMember {
  id: string;
  name: string;
  instrument: string;
  wantsPrintedSheetMusic?: boolean;
  availability?: {
    status: AvailabilityStatus['value'];
    note?: string;
  };
  canDrive?: boolean;
}

export interface Gig {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: 'pending' | 'confirmed' | 'declined' | 'completed';
  isWholeDay: boolean;
  isMultiDay: boolean;
  dates: string[];
  location: string | null;
  distance: number | null;
  pay: number | null;
  description: string | null;
  memberAvailability: {
    [userId: string]: MemberAvailability;
  };
  createdBy: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}