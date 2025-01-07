import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';

interface NavLinksProps {
  mobile?: boolean;
}

const NavLinks = ({ mobile }: NavLinksProps) => {
  const baseClasses = mobile
    ? "block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
    : "text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium";

  return (
    <>
      <Link to="/gigs" className={baseClasses}>
        Gigs
      </Link>
      <Link to="/members" className={baseClasses}>
        Members
      </Link>
      <Link to="/settings" className={baseClasses}>
        Settings
      </Link>
    </>
  );
};

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-auto"
              />
              <span className="ml-2 text-lg font-semibold hidden sm:block">
                Alarmfase 3
              </span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <NavLinks />
            <UserButton />
          </div>
        </div>

        {/* Mobile navigation */}
        <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden pb-3`}>
          <div className="pt-2 pb-3 space-y-1">
            <NavLinks mobile />
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}; 