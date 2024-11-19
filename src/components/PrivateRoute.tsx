import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function PrivateRoute({ 
  children, 
  requireVerification = false,
}: PrivateRouteProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const { roles, loading: rolesLoading } = useRole();

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" />;
  }

  // Check if user has any role assigned
  const hasRole = roles.admin || roles.bandManager || roles.bandMember;
  if (!hasRole) {
    const handleSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Pending</h2>
            <p className="text-gray-600 mb-6">
              Your account is awaiting role assignment. Please contact an administrator for access.
            </p>
            <button
              onClick={handleSignOut}
              className="text-indigo-600 hover:text-indigo-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requireVerification && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Verification Required</h2>
            <p className="text-gray-600 mb-6">
              Please verify your email address to access this feature. Check your inbox for the verification link.
            </p>
            <Link
              to="/gigs"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Return to Gigs List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}