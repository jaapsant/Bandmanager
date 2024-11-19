import { useState, useEffect } from 'react';
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  getFirestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

interface UserRole {
  uid: string;
  email: string;
  admin?: boolean;
  bandManager?: boolean;
}

export function UserRoleManager() {
  const [users, setUsers] = useState<UserRole[]>([]);
  const db = getFirestore();

  useEffect(() => {
    const fetchUsers = async () => {
      const rolesSnapshot = await getDocs(collection(db, 'roles'));
      const rolesData = rolesSnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserRole[];
      setUsers(rolesData);
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (
    uid: string,
    role: 'admin' | 'bandManager',
    enabled: boolean
  ) => {
    try {
      const roleRef = doc(db, 'roles', uid);
      await setDoc(roleRef, { [role]: enabled }, { merge: true });

      // Update local state
      setUsers(
        users.map((user) =>
          user.uid === uid ? { ...user, [role]: enabled } : user
        )
      );
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  return (
    <div>
      <h2>User Role Management</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Admin</th>
            <th>Band Manager</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td>{user.email}</td>
              <td>
                <input
                  type="checkbox"
                  checked={user.admin || false}
                  onChange={(e) =>
                    handleRoleChange(user.uid, 'admin', e.target.checked)
                  }
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={user.bandManager || false}
                  onChange={(e) =>
                    handleRoleChange(user.uid, 'bandManager', e.target.checked)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
