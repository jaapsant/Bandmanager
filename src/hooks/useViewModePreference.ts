import { useState, useEffect, useCallback } from 'react';

export type ViewMode = 'grid' | 'compact';

type DeviceType = 'mobile' | 'desktop';

const STORAGE_KEYS = {
  mobile: 'gigListViewMode.mobile',
  desktop: 'gigListViewMode.desktop',
} as const;

const DEFAULT_VALUES: Record<DeviceType, ViewMode> = {
  mobile: 'compact',
  desktop: 'grid',
};

// Tailwind's md breakpoint
const MOBILE_BREAKPOINT = 768;

/**
 * Determines if the current viewport is mobile-sized
 */
function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
}

/**
 * Safely reads from localStorage
 */
function getStoredPreference(deviceType: DeviceType): ViewMode | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[deviceType]);
    if (stored === 'grid' || stored === 'compact') {
      return stored;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely writes to localStorage
 */
function setStoredPreference(deviceType: DeviceType, value: ViewMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS[deviceType], value);
  } catch {
    // localStorage unavailable, ignore
  }
}

export interface UseViewModePreferenceReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  deviceType: DeviceType;
}

/**
 * Custom hook for managing device-specific view mode preferences.
 * Stores separate preferences for mobile and desktop/tablet devices.
 */
export function useViewModePreference(): UseViewModePreferenceReturn {
  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const device = getDeviceType();
    return getStoredPreference(device) ?? DEFAULT_VALUES[device];
  });

  // Handle window resize to detect device type changes
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newDeviceType = getDeviceType();
        if (newDeviceType !== deviceType) {
          setDeviceType(newDeviceType);
          // Load the preference for the new device type
          const storedPref = getStoredPreference(newDeviceType);
          setViewModeState(storedPref ?? DEFAULT_VALUES[newDeviceType]);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [deviceType]);

  // Setter that persists to localStorage
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    setStoredPreference(deviceType, mode);
  }, [deviceType]);

  return {
    viewMode,
    setViewMode,
    deviceType,
  };
}
