import { collection, doc, getDocs, query, setDoc, updateDoc, where, DocumentReference } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface NewMemberDefaults {
  name: string;
  createdBy?: string;
}

/**
 * Gets an existing band member document reference or creates a new one if it doesn't exist.
 *
 * Note: Band members are stored with a document ID that may differ from the member's user ID.
 * The `id` field inside the document stores the user's UID, which is used for lookups.
 *
 * @param memberId - The user ID of the band member
 * @param defaults - Default values to use when creating a new member document
 * @returns Object containing the document reference and whether the member existed
 */
export async function getOrCreateMemberDoc(
  memberId: string,
  defaults: NewMemberDefaults
): Promise<{ docRef: DocumentReference; exists: boolean }> {
  const memberSnapshot = await getDocs(
    query(collection(db, 'bandMembers'), where('id', '==', memberId))
  );

  if (memberSnapshot.empty) {
    // Create new member document
    const newDocRef = doc(collection(db, 'bandMembers'));
    await setDoc(newDocRef, {
      id: memberId,
      name: defaults.name,
      instrument: '',
      createdBy: defaults.createdBy,
    });
    return { docRef: newDocRef, exists: false };
  }

  return { docRef: memberSnapshot.docs[0].ref, exists: true };
}

/**
 * Updates a band member document, creating it if it doesn't exist.
 *
 * @param memberId - The user ID of the band member
 * @param updateData - The fields to update
 * @param defaults - Default values to use when creating a new member document
 */
export async function updateOrCreateMember(
  memberId: string,
  updateData: Record<string, unknown>,
  defaults: NewMemberDefaults
): Promise<void> {
  const { docRef, exists } = await getOrCreateMemberDoc(memberId, defaults);

  if (exists) {
    await updateDoc(docRef, updateData);
  } else {
    // Document was just created with defaults, now update with additional data
    await updateDoc(docRef, updateData);
  }
}
