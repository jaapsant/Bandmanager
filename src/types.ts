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

export interface Gig {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isWholeDay: boolean;
  status: GigStatus['value'];
  location: string | null;
  pay?: number | null;
  description?: string | null;
  memberAvailability: Record<string, {
    status: AvailabilityStatus['value'];
    note?: string;
    canDrive?: boolean | null;
  }>;
  createdBy: string;
  distance: number | null;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}