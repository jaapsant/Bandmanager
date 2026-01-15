import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGigs } from '../context/GigContext';
import { useAuth } from '../context/AuthContext';
import { useRole } from './useRole';
import { useViewModePreference, ViewMode } from './useViewModePreference';
import { Gig } from '../types';

export type GroupedGigs = {
  [year: string]: Gig[];
};

export type { ViewMode } from './useViewModePreference';

export interface UseGigListReturn {
  // Data
  upcomingGigs: Gig[];
  pastGigs: Gig[];
  groupedPastGigs: GroupedGigs;
  user: ReturnType<typeof useAuth>['user'];

  // State
  loading: boolean;
  showHistory: boolean;
  viewMode: ViewMode;
  expandedYears: { [year: string]: boolean };
  canManageGigs: boolean;

  // Actions
  setShowHistory: (show: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleYear: (year: string) => void;
  navigateToGig: (gigId: string) => void;
  navigateToNewGig: () => void;
  navigateToBandMembers: () => void;
  navigateToYearOverview: (year: string) => void;

  // Utilities
  isYearExpanded: (year: string) => boolean;

  // Translation
  t: ReturnType<typeof useTranslation>['t'];
}

/**
 * Gets the earliest date from a gig (for multi-day gigs, this is the first date)
 */
function getEarliestDate(gig: Gig): Date {
  if (gig.isMultiDay) {
    const allDates = [gig.date, ...gig.dates].map(date => new Date(date));
    return new Date(Math.min(...allDates.map(d => d.getTime())));
  }
  return new Date(gig.date);
}

/**
 * Custom hook for GigList page state and logic
 */
export function useGigList(): UseGigListReturn {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { gigs, loading } = useGigs();
  const { user } = useAuth();
  const { roles } = useRole();
  const { viewMode, setViewMode } = useViewModePreference();

  const [showHistory, setShowHistory] = useState(false);
  const [expandedYears, setExpandedYears] = useState<{ [year: string]: boolean }>({});

  const canManageGigs = roles.admin || roles.bandManager;

  // Update showHistory when location changes (e.g., coming from gig details of a past gig)
  useEffect(() => {
    const state = location.state as { showHistory?: boolean } | null;
    setShowHistory(state?.showHistory || false);
  }, [location]);

  // Sort gigs by earliest date
  const sortedGigs = useMemo(() => {
    return [...gigs].sort((a, b) => {
      const dateA = getEarliestDate(a);
      const dateB = getEarliestDate(b);
      return dateA.getTime() - dateB.getTime();
    });
  }, [gigs]);

  // Split gigs into upcoming and past
  const { upcomingGigs, pastGigs } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = sortedGigs.reduce<{ upcomingGigs: Gig[]; pastGigs: Gig[] }>(
      (acc, gig) => {
        const gigDate = new Date(gig.date);
        gigDate.setHours(23, 59, 59, 999);

        if (gigDate >= today) {
          acc.upcomingGigs.push(gig);
        } else {
          acc.pastGigs.push(gig);
        }
        return acc;
      },
      { upcomingGigs: [], pastGigs: [] }
    );

    // Sort upcoming gigs ascending, past gigs descending
    result.upcomingGigs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.pastGigs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return result;
  }, [sortedGigs]);

  // Group past gigs by year
  const groupedPastGigs = useMemo(() => {
    return pastGigs.reduce<GroupedGigs>((acc, gig) => {
      const year = new Date(gig.date).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(gig);
      return acc;
    }, {});
  }, [pastGigs]);

  // Check if a year is expanded (default: current year and previous year)
  const isYearExpanded = useCallback((year: string) => {
    if (year in expandedYears) {
      return expandedYears[year];
    }
    const currentYear = new Date().getFullYear();
    return Number(year) >= currentYear - 1;
  }, [expandedYears]);

  // Toggle year expansion
  const toggleYear = useCallback((year: string) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !isYearExpanded(year)
    }));
  }, [isYearExpanded]);

  // Navigation handlers
  const navigateToGig = useCallback((gigId: string) => {
    navigate(`/gig/${gigId}`);
  }, [navigate]);

  const navigateToNewGig = useCallback(() => {
    navigate('/gigs/new');
  }, [navigate]);

  const navigateToBandMembers = useCallback(() => {
    navigate('/band-members');
  }, [navigate]);

  const navigateToYearOverview = useCallback((year: string) => {
    navigate(`/year-overview/${year}`);
  }, [navigate]);

  return {
    // Data
    upcomingGigs,
    pastGigs,
    groupedPastGigs,
    user,

    // State
    loading,
    showHistory,
    viewMode,
    expandedYears,
    canManageGigs,

    // Actions
    setShowHistory,
    setViewMode,
    toggleYear,
    navigateToGig,
    navigateToNewGig,
    navigateToBandMembers,
    navigateToYearOverview,

    // Utilities
    isYearExpanded,

    // Translation
    t,
  };
}
