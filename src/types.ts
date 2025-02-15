export interface GigStatus {
  value: 'pending' | 'confirmed' | 'declined' | 'completed';
  label: string;
  color: string;
}

export type AvailabilityStatus = {
  value: 'available' | 'unavailable' | 'maybe';
  label: 'gigs.available' | 'gigs.unavailable' | 'gigs.maybe';
}

export interface BandMember {
  id: string;
  name: string;
  instrument: string;
  availability?: {
    status: AvailabilityStatus['value'];
    note?: string;
  };
  canDrive?: boolean;
}

export interface MemberAvailability {
  status: AvailabilityStatus['value'];
  note?: string;
  canDrive?: boolean;
  dateAvailability?: {
    [date: string]: {
      status: AvailabilityStatus['value'];
      note?: string;
      canDrive?: boolean;
    };
  };
}

export interface Gig {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: GigStatus;
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