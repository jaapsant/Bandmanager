import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertCircle, Trash2 } from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, deleteUser } from 'firebase/auth';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

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
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('userRoles.deleteModal.title')}
        </h3>
        <p className="text-gray-600 mb-6">
          {t('userRoles.deleteModal.message')} <span className="font-semibold">{user.email}</span>? 
          {t('userRoles.deleteModal.warning')}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {t('userRoles.deleteModal.cancelButton')}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {t('userRoles.deleteModal.deleteButton')}
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
  const { t } = useTranslation();

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
          throw new Error(t('userRoles.errors.lastAdmin'));
        }
      }

      const roleRef = doc(db, 'roles', uid);
      await setDoc(roleRef, { [role]: enabled }, { merge: true });

      setUsers(users.map(user =>
        user.uid === uid ? { ...user, [role]: enabled } : user
      ));

      setSuccessMessage(t('userRoles.success.roleUpdate'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('userRoles.errors.updateRole'));
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
          throw new Error(t('userRoles.errors.lastAdmin'));
        }
      }

      // Don't allow self-deletion
      if (userToDelete.uid === user?.uid) {
        throw new Error(t('userRoles.errors.selfDelete'));
      }

      // Delete user documents
      await Promise.all([
        deleteDoc(doc(db, 'users', userToDelete.uid)),
        deleteDoc(doc(db, 'roles', userToDelete.uid)),
        deleteDoc(doc(db, 'bandMembers', userToDelete.uid))
      ]);

      // Update local state
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      setSuccessMessage(t('userRoles.success.userDelete'));
    } catch (error) {
      setError(error instanceof Error ? error.message : t('userRoles.errors.deleteUser'));
    } finally {
      setUserToDelete(null);
    }
  };

  if (!roles.admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('userRoles.accessDenied.title')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('userRoles.accessDenied.message')}
          </p>
          <button
            onClick={() => navigate('/gigs')}
            className="text-red-600 hover:text-red-500"
          >
            {t('userRoles.accessDenied.returnButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/gigs')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('userRoles.backToGigs')}
          </button>
          <LanguageSwitcher />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-red-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">{t('userRoles.title')}</h1>
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
                      {t('userRoles.tableHeaders.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userRoles.tableHeaders.admin')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userRoles.tableHeaders.bandManager')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userRoles.tableHeaders.bandMember')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('userRoles.tableHeaders.actions')}
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
                            className="form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            checked={user.admin || false}
                            onChange={(e) => handleRoleChange(user.uid, 'admin', e.target.checked)}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                            checked={user.bandManager || false}
                            onChange={(e) => handleRoleChange(user.uid, 'bandManager', e.target.checked)}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
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