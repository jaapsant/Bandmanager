import React from 'react';
import { Link } from 'react-router-dom';
import { Music, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';

export function Header() {
  const { user, signOut } = useAuth();
  const { roles } = useRole();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/gigs" className="flex items-center text-indigo-600">
            <Music className="w-8 h-8" />
            <span className="ml-2 text-lg font-semibold">Band Manager</span>
          </Link>

          <div className="relative group">
            <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
              <User className="w-5 h-5" />
              <span>{user?.displayName}</span>
            </button>
            <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out">
              <Link
                to="/profile"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile Settings
              </Link>
              {roles.admin && (
                <Link
                  to="/user-roles"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Manage Roles
                </Link>
              )}
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}