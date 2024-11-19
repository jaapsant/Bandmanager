export interface GigStatus {
  value: 'pending' | 'confirmed' | 'declined' | 'completed';
  label: string;
  color: string;
}

export interface BandMember {
  id: string;
  name: string;
  instrument: string;
  availability?: {
    status: 'available' | 'unavailable' | 'tentative';
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
  location?: string | null;
  pay?: number | null;
  description?: string | null;
  memberAvailability: Record<string, {
    status: 'available' | 'unavailable' | 'tentative';
    note?: string;
    canDrive?: boolean;
  }>;
  createdBy: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}