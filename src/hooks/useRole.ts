import { useState, useEffect } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function useRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<{
    admin?: boolean;
    bandManager?: boolean;
    bandMember?: boolean;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) {
        setRoles({});
        setLoading(false);
        return;
      }

      try {
        const db = getFirestore();
        const roleDoc = await getDoc(doc(db, 'roles', user.uid));
        setRoles(roleDoc.data() || {});
      } catch (error) {
        console.error('Error fetching roles:', error);
        setRoles({});
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user]);

  return { roles, loading };
}