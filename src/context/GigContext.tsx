import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gig } from '../types';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
        console.error(t('gigContext.errors.fetchGigs'), error);
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
  }, [user, t]);

  const validateGigData = (gigData: Partial<Gig>, originalGig?: Gig) => {
    if (!gigData.name?.trim()) {
      throw new Error(t('gigContext.errors.validation.nameRequired'));
    }

    if (!gigData.date) {
      throw new Error(t('gigContext.errors.validation.dateRequired'));
    }

    const gigDate = new Date(gigData.date);
    gigDate.setHours(23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (originalGig) {
      const originalDate = new Date(originalGig.date);
      if (gigDate.getTime() !== originalDate.getTime() && gigDate < today) {
        throw new Error(t('gigContext.errors.validation.changePastDate'));
      }
    } else if (gigDate < today) {
      throw new Error(t('gigContext.errors.validation.pastDate'));
    }

    if (!gigData.isWholeDay && gigData.startTime && gigData.endTime) {
      const [startHours, startMinutes] = gigData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = gigData.endTime.split(':').map(Number);

      if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
        throw new Error(t('gigContext.errors.validation.timeRange'));
      }
    }

    return true;
  };

  const addGig = async (newGig: Omit<Gig, 'id'>) => {
    if (!user?.emailVerified) {
      throw new Error(t('gigContext.errors.validation.emailVerification'));
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
      throw error instanceof Error ? error : new Error(t('gigContext.errors.addGig'));
    }
  };

  const updateGig = async (updatedGig: Gig) => {
    try {
      const originalGig = gigs.find(g => g.id === updatedGig.id);
      if (!originalGig) throw new Error(t('gigContext.errors.validation.gigNotFound'));

      if (updatedGig.date !== originalGig.date) {
        const gigDate = new Date(updatedGig.date);
        gigDate.setHours(23, 59, 59, 999);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (gigDate < today) {
          throw new Error(t('gigContext.errors.validation.changePastDate'));
        }
      }

      const gigRef = doc(db, 'gigs', updatedGig.id);

      // Detect if only memberAvailability has changed
      const changedFields: string[] = [];
      Object.keys(updatedGig).forEach(key => {
        if (key === 'id') return; // Skip id field
        const originalValue = originalGig[key as keyof Gig];
        const updatedValue = updatedGig[key as keyof Gig];

        // Deep comparison for memberAvailability
        if (key === 'memberAvailability') {
          if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
            changedFields.push(key);
          }
        } else if (originalValue !== updatedValue) {
          changedFields.push(key);
        }
      });

      // If only memberAvailability changed, use partial update
      // This allows band members to update their availability
      if (changedFields.length === 1 && changedFields[0] === 'memberAvailability') {
        await updateDoc(gigRef, {
          memberAvailability: updatedGig.memberAvailability
        });
      } else {
        // For all other cases (admins/managers editing gig details), update entire document
        await updateDoc(gigRef, updatedGig as any);
      }

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
      throw new Error(t('gigContext.errors.validation.emailVerification'));
    }

    try {
      const gigRef = doc(db, 'gigs', gigId);
      await deleteDoc(gigRef);
    } catch (error) {
      console.error('Error deleting gig:', error);
      throw error instanceof Error ? error : new Error(t('gigContext.errors.validation.deleteFailed'));
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
  const { t } = useTranslation();
  if (context === null) {
    throw new Error(t('gigContext.errors.useGigsHook'));
  }
  return context;
}