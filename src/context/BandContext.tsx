import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, getDocs, where, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BandMember } from '../types';
import { useAuth } from './AuthContext';
import { useRole } from '../hooks/useRole';
import { useTranslation } from 'react-i18next';
import { updateOrCreateMember } from '../utils/firestoreHelpers';


interface BandContextType {
  bandMembers: BandMember[];
  instruments: string[];
  addBandMember: (member: Omit<BandMember, 'id'>) => Promise<void>;
  removeBandMember: (memberId: string) => Promise<void>;
  updateMemberInstrument: (memberId: string, instrument: string) => Promise<void>;
  updateMemberName: (memberId: string, name: string) => Promise<void>;
  updateMemberSheetMusicPreference: (memberId: string, wantsPrintedSheetMusic: boolean) => Promise<void>;
  updateMemberDrivingPreferences: (memberId: string, preferences: BandMember['drivingAvailability']) => Promise<void>;
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

  // Listen for band members changes and merge with users who have bandMember role
  useEffect(() => {
    let unsubscribeBandMembers: (() => void) | undefined;
    let unsubscribeRoles: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;

    if (user) {
      let bandMembersData: BandMember[] = [];
      let rolesData: Record<string, { bandMember?: boolean }> = {};
      let usersData: Record<string, { displayName?: string; email?: string }> = {};

      const mergeAndSetMembers = () => {
        // Start with existing band members
        const memberMap = new Map<string, BandMember>();

        bandMembersData.forEach(member => {
          memberMap.set(member.id, member);
        });

        // Add users who have bandMember role but no bandMembers document yet
        Object.entries(rolesData).forEach(([uid, role]) => {
          if (role.bandMember && !memberMap.has(uid)) {
            const userData = usersData[uid];
            memberMap.set(uid, {
              id: uid,
              name: userData?.displayName || userData?.email || '',
              instrument: '',
              wantsPrintedSheetMusic: undefined,
              drivingAvailability: undefined,
            });
          }
        });

        setBandMembers(Array.from(memberMap.values()));
      };

      // Listen to bandMembers collection
      const membersQuery = query(collection(db, 'bandMembers'));
      unsubscribeBandMembers = onSnapshot(membersQuery, (snapshot) => {
        bandMembersData = snapshot.docs.map(doc => ({
          id: doc.data().id || doc.id,
          name: doc.data().name || '',
          instrument: doc.data().instrument || '',
          wantsPrintedSheetMusic: doc.data().wantsPrintedSheetMusic,
          drivingAvailability: doc.data().drivingAvailability,
        })) as BandMember[];
        mergeAndSetMembers();
      }, (error) => {
        console.error('Error fetching band members:', error);
      });

      // Listen to roles collection
      const rolesQuery = query(collection(db, 'roles'));
      unsubscribeRoles = onSnapshot(rolesQuery, (snapshot) => {
        rolesData = {};
        snapshot.docs.forEach(doc => {
          rolesData[doc.id] = doc.data() as { bandMember?: boolean };
        });
        mergeAndSetMembers();
      }, (error) => {
        console.error('Error fetching roles:', error);
      });

      // Listen to users collection
      const usersQuery = query(collection(db, 'users'));
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        usersData = {};
        snapshot.docs.forEach(doc => {
          usersData[doc.id] = doc.data() as { displayName?: string; email?: string };
        });
        mergeAndSetMembers();
      }, (error) => {
        console.error('Error fetching users:', error);
      });
    } else {
      setBandMembers([]);
    }

    return () => {
      if (unsubscribeBandMembers) unsubscribeBandMembers();
      if (unsubscribeRoles) unsubscribeRoles();
      if (unsubscribeUsers) unsubscribeUsers();
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

      // Get the member's current name from bandMembers state (not the admin's name)
      const member = bandMembers.find(m => m.id === memberId);
      const memberName = member?.name || '';

      await updateOrCreateMember(
        memberId,
        { instrument },
        { name: memberName, createdBy: user?.uid }
      );
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

      await updateOrCreateMember(
        memberId,
        { name: name.trim() },
        { name: name.trim(), createdBy: user?.uid }
      );
    } catch (error) {
      console.error('Error updating name:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToUpdateName'));
    }
  };

  const updateMemberSheetMusicPreference = async (memberId: string, wantsPrintedSheetMusic: boolean) => {
    checkPermission();

    try {
      if (memberId !== user?.uid && !roles.admin && !roles.bandManager) {
        throw new Error(t('bandContext.errors.updateOwnPreferenceOnly'));
      }

      await updateOrCreateMember(
        memberId,
        { wantsPrintedSheetMusic },
        { name: user?.displayName || '', createdBy: user?.uid }
      );
    } catch (error) {
      console.error('Error updating sheet music preference:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToUpdateSheetMusicPreference'));
    }
  };

  const updateMemberDrivingPreferences = async (memberId: string, preferences: BandMember['drivingAvailability']) => {
    checkPermission();

    try {
      if (memberId !== user?.uid && !roles.admin && !roles.bandManager) {
        throw new Error(t('bandContext.errors.updateOwnPreferenceOnly'));
      }

      await updateOrCreateMember(
        memberId,
        { drivingAvailability: preferences },
        { name: user?.displayName || '', createdBy: user?.uid }
      );
    } catch (error) {
      console.error('Error updating driving preferences:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(t('bandContext.errors.failedToUpdateDrivingPreferences'));
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
      updateMemberSheetMusicPreference,
      updateMemberDrivingPreferences,
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