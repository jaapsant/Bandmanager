import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, getDocs, updateDoc, where, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BandMember } from '../types';
import { useAuth } from './AuthContext';
import { useRole } from '../hooks/useRole';
import { useTranslation } from 'react-i18next';


interface BandContextType {
  bandMembers: BandMember[];
  instruments: string[];
  addBandMember: (member: Omit<BandMember, 'id'>) => Promise<void>;
  removeBandMember: (memberId: string) => Promise<void>;
  updateMemberInstrument: (memberId: string, instrument: string) => Promise<void>;
  updateMemberName: (memberId: string, name: string) => Promise<void>;
  addInstrument: (instrument: string) => Promise<void>;
  removeInstrument: (instrument: string) => Promise<void>;
  isInstrumentInUse: (instrument: string) => boolean;
  loading: boolean;
}

const BandContext = createContext<BandContextType | undefined>(undefined);

export function BandProvider({ children }: { children: React.ReactNode }) {
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { roles } = useRole();
  const { t } = useTranslation();

  // Listen for band members changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      const membersQuery = query(collection(db, 'bandMembers'));
      unsubscribe = onSnapshot(membersQuery, (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
          id: doc.data().id || doc.id,
          name: doc.data().name || '',
          instrument: doc.data().instrument || '',
        })) as BandMember[];
        setBandMembers(membersData);
      }, (error) => {
        console.error('Error fetching band members:', error);
      });
    } else {
      setBandMembers([]);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Listen for instruments changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      const instrumentsQuery = query(collection(db, 'instruments'));
      unsubscribe = onSnapshot(instrumentsQuery, (snapshot) => {
        const instrumentsData = snapshot.docs.map(doc => doc.data().name as string);
        setInstruments(instrumentsData);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching instruments:', error);
        setLoading(false);
      });
    } else {
      setInstruments([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Sync current user's display name with band member name
  useEffect(() => {
    if (user?.displayName) {
      const currentMember = bandMembers.find(member => member.id === user.uid);
      if (currentMember && currentMember.name !== user.displayName) {
        updateMemberName(user.uid, user.displayName).catch(console.error);
      }
    }
  }, [user?.displayName, bandMembers]);

  const isInstrumentInUse = (instrument: string) => {
    return bandMembers.some(member => member.instrument === instrument);
  };

  const checkPermission = () => {
    if (!user?.emailVerified) {
      throw new Error(t('bandContext.errors.emailVerificationRequired'));
    }
    if (!roles.admin && !roles.bandManager && !roles.bandMember) {
      throw new Error(t('bandContext.errors.insufficientPermissions'));
    }
  };

  const checkAdminOrManagerPermission = () => {
    if (!user?.emailVerified) {
      throw new Error(t('bandContext.errors.emailVerificationRequired'));
    }
    if (!roles.admin && !roles.bandManager) {
      throw new Error(t('bandContext.errors.adminManagerOnly'));
    }
  };

  const addBandMember = async (newMember: Omit<BandMember, 'id'>) => {
    checkAdminOrManagerPermission();

    try {
      const docRef = doc(collection(db, 'bandMembers'));
      const memberId = docRef.id;
      await setDoc(docRef, {
        id: memberId,
        name: newMember.name.trim(),
        instrument: newMember.instrument,
        createdBy: user?.uid,
      });
    } catch (error) {
      console.error('Error adding band member:', error);
      throw new Error(t('bandContext.errors.failedToAddMember'));
    }
  };

  const removeBandMember = async (memberId: string) => {
    checkAdminOrManagerPermission();

    try {
      if (memberId === user?.uid) {
        throw new Error(t('bandContext.errors.cannotRemoveSelf'));
      }

      const memberDoc = doc(db, 'bandMembers', memberId);
      await deleteDoc(memberDoc);
    } catch (error) {
      console.error('Error removing band member:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToRemoveMember'));
    }
  };

  const updateMemberInstrument = async (memberId: string, instrument: string) => {
    checkPermission();

    try {
      if (memberId !== user?.uid && !roles.admin && !roles.bandManager) {
        throw new Error(t('bandContext.errors.updateOwnInstrumentOnly'));
      }

      const memberDoc = doc(db, 'bandMembers', memberId);
      const memberSnapshot = await getDocs(query(collection(db, 'bandMembers'), where('id', '==', memberId)));
      
      if (memberSnapshot.empty) {
        await setDoc(memberDoc, {
          id: memberId,
          name: user?.displayName || '',
          instrument: instrument,
          createdBy: user?.uid,
        });
      } else {
        await updateDoc(memberDoc, { instrument });
      }
    } catch (error) {
      console.error('Error updating instrument:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToUpdateInstrument'));
    }
  };

  const updateMemberName = async (memberId: string, name: string) => {
    checkPermission();

    try {
      if (memberId !== user?.uid && !roles.admin && !roles.bandManager) {
        throw new Error(t('bandContext.errors.updateOwnNameOnly'));
      }

      const memberDoc = doc(db, 'bandMembers', memberId);
      const memberSnapshot = await getDocs(query(collection(db, 'bandMembers'), where('id', '==', memberId)));
      
      if (memberSnapshot.empty) {
        await setDoc(memberDoc, {
          id: memberId,
          name: name.trim(),
          instrument: '',
          createdBy: user?.uid,
        });
      } else {
        await updateDoc(memberDoc, { name: name.trim() });
      }
    } catch (error) {
      console.error('Error updating name:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToUpdateName'));
    }
  };

  const addInstrument = async (instrument: string) => {
    checkAdminOrManagerPermission();

    try {
      const trimmedInstrument = instrument.trim();
      if (!instruments.includes(trimmedInstrument)) {
        const docRef = doc(collection(db, 'instruments'));
        await setDoc(docRef, { name: trimmedInstrument });
      }
    } catch (error) {
      console.error('Error adding instrument:', error);
      throw new Error(t('bandContext.errors.failedToAddInstrument'));
    }
  };

  const removeInstrument = async (instrument: string) => {
    checkAdminOrManagerPermission();

    try {
      if (isInstrumentInUse(instrument)) {
        throw new Error(t('bandContext.errors.instrumentInUse'));
      }

      const instrumentsRef = collection(db, 'instruments');
      const q = query(instrumentsRef, where("name", "==", instrument));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error removing instrument:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToRemoveInstrument'));
    }
  };

  return (
    <BandContext.Provider value={{ 
      bandMembers, 
      instruments,
      addBandMember, 
      removeBandMember,
      updateMemberInstrument,
      updateMemberName,
      addInstrument,
      removeInstrument,
      isInstrumentInUse,
      loading,
    }}>
      {children}
    </BandContext.Provider>
  );
}

export function useBand() {
  const context = useContext(BandContext);
  if (context === undefined) {
    throw new Error('useBand must be used within a BandProvider');
  }
  return context;
}