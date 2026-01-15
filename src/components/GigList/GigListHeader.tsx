import { Plus, Users, History, Calendar, LayoutGrid, List } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { Menu as MenuIcon } from 'lucide-react';
import { TFunction } from 'i18next';
import { ViewMode } from '../../hooks/useGigList';

interface GigListHeaderProps {
  showHistory: boolean;
  viewMode: ViewMode;
  canManageGigs: boolean;
  isEmailVerified: boolean;
  onSetShowHistory: (show: boolean) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onNavigateToNewGig: () => void;
  onNavigateToBandMembers: () => void;
  t: TFunction;
}

export function GigListHeader({
  showHistory,
  viewMode,
  canManageGigs,
  isEmailVerified,
  onSetShowHistory,
  onSetViewMode,
  onNavigateToNewGig,
  onNavigateToBandMembers,
  t,
}: GigListHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">
        {showHistory ? t('gigList.title.history') : t('gigList.title.upcoming')}
      </h1>
      <div className="flex items-center">
        {/* Desktop view */}
        <div className="hidden md:flex space-x-4">
          {!showHistory && (
            <div className="flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => onSetViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium border ${viewMode === 'grid'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  } rounded-l-md flex items-center`}
                title={t('gigList.viewMode.grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSetViewMode('compact')}
                className={`px-4 py-2 text-sm font-medium border-t border-b border-r ${viewMode === 'compact'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  } rounded-r-md flex items-center`}
                title={t('gigList.viewMode.compact')}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={() => onSetShowHistory(!showHistory)}
            className="bg-white text-gray-600 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 border border-gray-300"
            title={showHistory ? t('gigList.buttons.showUpcoming') : t('gigList.buttons.showHistory')}
          >
            {showHistory ? (
              <Calendar className="w-5 h-5" />
            ) : (
              <History className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onNavigateToBandMembers}
            className="bg-white text-gray-600 px-4 py-2 rounded-md flex items-center hover:bg-gray-50 border border-gray-300"
            title={t('gigList.buttons.bandMembers')}
          >
            <Users className="w-5 h-5" />
          </button>
          {canManageGigs && isEmailVerified && !showHistory && (
            <button
              onClick={onNavigateToNewGig}
              className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-red-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('gigList.buttons.newGig')}
            </button>
          )}
        </div>

        {/* Mobile hamburger menu */}
        <div className="md:hidden">
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="bg-white p-2 rounded-md hover:bg-gray-50 border border-gray-300">
              <MenuIcon className="w-5 h-5 text-gray-600" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1">
                {!showHistory && (
                  <>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onSetViewMode('grid')}
                          className={`${active ? 'bg-gray-100' : ''
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        >
                          <LayoutGrid className="w-4 h-4 mr-2" />
                          {t('gigList.viewMode.grid')}
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onSetViewMode('compact')}
                          className={`${active ? 'bg-gray-100' : ''
                            } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        >
                          <List className="w-4 h-4 mr-2" />
                          {t('gigList.viewMode.compact')}
                        </button>
                      )}
                    </Menu.Item>
                  </>
                )}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => onSetShowHistory(!showHistory)}
                      className={`${active ? 'bg-gray-100' : ''
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      {showHistory ? (
                        <Calendar className="w-5 h-5 mr-2" />
                      ) : (
                        <History className="w-5 h-5 mr-2" />
                      )}
                      {showHistory ? t('gigList.buttons.showUpcoming') : t('gigList.buttons.showHistory')}
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onNavigateToBandMembers}
                      className={`${active ? 'bg-gray-100' : ''
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                    >
                      <Users className="w-5 h-5 mr-2" />
                      {t('gigList.buttons.bandMembers')}
                    </button>
                  )}
                </Menu.Item>
                {canManageGigs && isEmailVerified && !showHistory && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onNavigateToNewGig}
                        className={`${active ? 'bg-red-50' : ''
                          } group flex rounded-md items-center w-full px-2 py-2 text-sm text-red-600`}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        {t('gigList.buttons.newGig')}
                      </button>
                    )}
                  </Menu.Item>
                )}
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </div>
  );
}
