import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertCircle, Trash2 } from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

interface UserRole {
  uid: string;
  email: string;
  displayName: string;
  admin?: boolean;
  bandManager?: boolean;
  bandMember?: boolean;
}

interface DeleteConfirmationProps {
  user: UserRole;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmation({ user, onConfirm, onCancel }: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete User Account</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the account for <span className="font-semibold">{user.email}</span>? 
          This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}

export function UserRoles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles } = useRole();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // First check if current user is admin
        const currentUserRoleDoc = await getDoc(doc(db, 'roles', user?.uid || ''));
        if (!currentUserRoleDoc.exists() || !currentUserRoleDoc.data()?.admin) {
          throw new Error('Permission denied');
        }

        const usersSnapshot = await getDocs(collection(db, 'users'));
        const rolesSnapshot = await getDocs(collection(db, 'roles'));
        
        const rolesData = rolesSnapshot.docs.reduce((acc, doc) => ({
          ...acc,
          [doc.id]: doc.data()
        }), {} as Record<string, any>);

        const usersData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
          ...rolesData[doc.id]
        })) as UserRole[];

        setUsers(usersData.sort((a, b) => a.email.localeCompare(b.email)));
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('You do not have permission to manage user roles');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const handleRoleChange = async (uid: string, role: 'admin' | 'bandManager' | 'bandMember', enabled: boolean) => {
    try {
      setError('');
      setSuccessMessage('');

      // Don't allow removing the last admin
      if (role === 'admin' && !enabled) {
        const adminCount = users.filter(u => u.admin && u.uid !== uid).length;
        if (adminCount === 0) {
          throw new Error('Cannot remove the last admin');
        }
      }

      const roleRef = doc(db, 'roles', uid);
      await setDoc(roleRef, { [role]: enabled }, { merge: true });

      setUsers(users.map(user =>
        user.uid === uid ? { ...user, [role]: enabled } : user
      ));

      setSuccessMessage(`Role updated successfully`);
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userToDelete: UserRole) => {
    try {
      setError('');
      setSuccessMessage('');

      // Don't allow deleting the last admin
      if (userToDelete.admin) {
        const adminCount = users.filter(u => u.admin && u.uid !== userToDelete.uid).length;
        if (adminCount === 0) {
          throw new Error('Cannot delete the last admin account');
        }
      }

      // Don't allow self-deletion
      if (userToDelete.uid === user?.uid) {
        throw new Error('You cannot delete your own account');
      }

      // Delete user documents
      await Promise.all([
        deleteDoc(doc(db, 'users', userToDelete.uid)),
        deleteDoc(doc(db, 'roles', userToDelete.uid)),
        deleteDoc(doc(db, 'bandMembers', userToDelete.uid))
      ]);

      // Update local state
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      setSuccessMessage('User account deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user account');
    } finally {
      setUserToDelete(null);
    }
  };

  if (!roles.admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/gigs')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Return to Gigs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/gigs')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Gigs
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">User Role Management</h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}

          {loading ? (
            <div className="text-center py-4 text-gray-500">Loading users...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Band Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Band Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={user.admin || false}
                            onChange={(e) => handleRoleChange(user.uid, 'admin', e.target.checked)}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={user.bandManager || false}
                            onChange={(e) => handleRoleChange(user.uid, 'bandManager', e.target.checked)}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            checked={user.bandMember || false}
                            onChange={(e) => handleRoleChange(user.uid, 'bandMember', e.target.checked)}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full"
                          title="Delete user"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {userToDelete && (
        <DeleteConfirmation
          user={userToDelete}
          onConfirm={() => handleDeleteUser(userToDelete)}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}