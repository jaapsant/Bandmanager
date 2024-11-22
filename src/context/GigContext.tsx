import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gig } from '../types';
import { useAuth } from './AuthContext';

interface GigContextType {
  gigs: Gig[];
  addGig: (gig: Omit<Gig, 'id'>) => Promise<void>;
  updateGig: (gig: Gig) => Promise<void>;
  deleteGig: (gigId: string) => Promise<void>;
  loading: boolean;
}

const GigContext = createContext<GigContextType | null>(null);

export function GigProvider({ children }: { children: React.ReactNode }) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      const q = query(collection(db, 'gigs'), orderBy('date', 'asc'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const gigsData = snapshot.docs.map(doc => {
          const data = doc.data() as Omit<Gig, 'id'>;
          const gigDate = new Date(data.date);
          gigDate.setHours(23, 59, 59, 999);
          
          if (gigDate < new Date() && data.status === 'confirmed') {
            updateDoc(doc.ref, { status: 'completed' });
            return {
              id: doc.id,
              ...data,
              status: 'completed',
            } as Gig;
          }
          
          return {
            id: doc.id,
            ...data,
          } as Gig;
        });
        
        setGigs(gigsData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching gigs:', error);
        setLoading(false);
      });
    } else {
      setGigs([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const validateGigData = (gigData: Partial<Gig>, originalGig?: Gig) => {
    if (!gigData.name?.trim()) {
      throw new Error('Gig name is required');
    }

    if (!gigData.date) {
      throw new Error('Gig date is required');
    }

    const gigDate = new Date(gigData.date);
    gigDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // When updating a gig, only allow date changes to future dates
    // unless it's the same date as the original gig
    if (originalGig) {
      const originalDate = new Date(originalGig.date);
      if (gigDate.getTime() !== originalDate.getTime() && gigDate < today) {
        throw new Error('Cannot change gig date to a past date');
      }
    } else if (gigDate < today) {
      throw new Error('Cannot set gig date in the past');
    }

    if (!gigData.isWholeDay && gigData.startTime && gigData.endTime) {
      const [startHours, startMinutes] = gigData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = gigData.endTime.split(':').map(Number);
      
      if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
        throw new Error('End time must be after start time');
      }
    }

    return true;
  };

  const addGig = async (newGig: Omit<Gig, 'id'>) => {
    if (!user?.emailVerified) {
      throw new Error('Email verification required');
    }

    try {
      validateGigData(newGig);

      const gigData = {
        ...newGig,
        name: newGig.name.trim(),
        createdBy: user.uid,
        memberAvailability: newGig.memberAvailability || {},
        status: newGig.status || 'pending',
        isWholeDay: newGig.isWholeDay || false,
        startTime: newGig.isWholeDay ? null : (newGig.startTime || null),
        endTime: newGig.isWholeDay ? null : (newGig.endTime || null),
        pay: newGig.pay || null,
        description: newGig.description?.trim() || null,
        location: newGig.location?.trim() || null,
        distance: newGig.distance || null,
      };

      await addDoc(collection(db, 'gigs'), gigData);
    } catch (error) {
      console.error('Error adding gig:', error);
      throw error instanceof Error ? error : new Error('Failed to create gig');
    }
  };

  const updateGig = async (updatedGig: Gig) => {
    try {
      // Get the original gig
      const originalGig = gigs.find(g => g.id === updatedGig.id);
      if (!originalGig) throw new Error('Gig not found');

      // Only validate date if it's being changed
      if (updatedGig.date !== originalGig.date) {
        const gigDate = new Date(updatedGig.date);
        gigDate.setHours(23, 59, 59, 999);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (gigDate < today) {
          throw new Error('Cannot change gig date to a past date');
        }
      }

      const gigRef = doc(db, 'gigs', updatedGig.id);
      await updateDoc(gigRef, updatedGig as any);
      
      setGigs(prev => prev.map(gig => 
        gig.id === updatedGig.id ? updatedGig : gig
      ));
    } catch (error) {
      console.error('Error updating gig:', error);
      throw error;
    }
  };

  const deleteGig = async (gigId: string) => {
    if (!user?.emailVerified) {
      throw new Error('Email verification required');
    }

    try {
      const gigRef = doc(db, 'gigs', gigId);
      await deleteDoc(gigRef);
    } catch (error) {
      console.error('Error deleting gig:', error);
      throw error instanceof Error ? error : new Error('Failed to delete gig');
    }
  };

  return (
    <GigContext.Provider value={{ gigs, addGig, updateGig, deleteGig, loading }}>
      {children}
    </GigContext.Provider>
  );
}

export function useGigs() {
  const context = useContext(GigContext);
  if (context === null) {
    throw new Error('useGigs must be used within a GigProvider');
  }
  return context;
}