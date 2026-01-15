import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewModePreference } from './useViewModePreference';

describe('useViewModePreference hook', () => {
  const originalInnerWidth = window.innerWidth;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageMock[key] ?? null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        localStorageMock[key] = value;
      }
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  const setWindowWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  describe('default values', () => {
    it('should return compact as default for mobile devices', () => {
      setWindowWidth(500);
      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('compact');
      expect(result.current.deviceType).toBe('mobile');
    });

    it('should return grid as default for desktop devices', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('grid');
      expect(result.current.deviceType).toBe('desktop');
    });
  });

  describe('stored preferences', () => {
    it('should return stored preference for mobile when on mobile', () => {
      setWindowWidth(500);
      localStorageMock['gigListViewMode.mobile'] = 'grid';

      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('grid');
      expect(result.current.deviceType).toBe('mobile');
    });

    it('should return stored preference for desktop when on desktop', () => {
      setWindowWidth(1024);
      localStorageMock['gigListViewMode.desktop'] = 'compact';

      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('compact');
      expect(result.current.deviceType).toBe('desktop');
    });

    it('should ignore invalid stored values', () => {
      setWindowWidth(1024);
      localStorageMock['gigListViewMode.desktop'] = 'invalid';

      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('grid'); // default for desktop
    });
  });

  describe('setViewMode', () => {
    it('should save preference to mobile localStorage key when on mobile', () => {
      setWindowWidth(500);
      const { result } = renderHook(() => useViewModePreference());

      act(() => {
        result.current.setViewMode('grid');
      });

      expect(result.current.viewMode).toBe('grid');
      expect(localStorageMock['gigListViewMode.mobile']).toBe('grid');
      expect(localStorageMock['gigListViewMode.desktop']).toBeUndefined();
    });

    it('should save preference to desktop localStorage key when on desktop', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useViewModePreference());

      act(() => {
        result.current.setViewMode('compact');
      });

      expect(result.current.viewMode).toBe('compact');
      expect(localStorageMock['gigListViewMode.desktop']).toBe('compact');
      expect(localStorageMock['gigListViewMode.mobile']).toBeUndefined();
    });
  });

  describe('window resize handling', () => {
    it('should switch to mobile preference when resizing to mobile', () => {
      setWindowWidth(1024);
      localStorageMock['gigListViewMode.mobile'] = 'compact';
      localStorageMock['gigListViewMode.desktop'] = 'grid';

      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('grid');
      expect(result.current.deviceType).toBe('desktop');

      // Resize to mobile
      act(() => {
        setWindowWidth(500);
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(150); // Wait for debounce
      });

      expect(result.current.viewMode).toBe('compact');
      expect(result.current.deviceType).toBe('mobile');
    });

    it('should switch to desktop preference when resizing to desktop', () => {
      setWindowWidth(500);
      localStorageMock['gigListViewMode.mobile'] = 'compact';
      localStorageMock['gigListViewMode.desktop'] = 'grid';

      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('compact');
      expect(result.current.deviceType).toBe('mobile');

      // Resize to desktop
      act(() => {
        setWindowWidth(1024);
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(150); // Wait for debounce
      });

      expect(result.current.viewMode).toBe('grid');
      expect(result.current.deviceType).toBe('desktop');
    });

    it('should not change state when resizing within same device type', () => {
      setWindowWidth(1024);
      const { result } = renderHook(() => useViewModePreference());

      const initialViewMode = result.current.viewMode;

      act(() => {
        setWindowWidth(1200); // Still desktop
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(150);
      });

      expect(result.current.viewMode).toBe(initialViewMode);
      expect(result.current.deviceType).toBe('desktop');
    });

    it('should use default when switching device type with no stored preference', () => {
      setWindowWidth(1024);
      // No stored preferences

      const { result } = renderHook(() => useViewModePreference());

      expect(result.current.viewMode).toBe('grid'); // desktop default

      // Resize to mobile
      act(() => {
        setWindowWidth(500);
        window.dispatchEvent(new Event('resize'));
        vi.advanceTimersByTime(150);
      });

      expect(result.current.viewMode).toBe('compact'); // mobile default
    });
  });

  describe('localStorage unavailability', () => {
    it('should handle localStorage.getItem throwing an error', () => {
      setWindowWidth(1024);
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useViewModePreference());

      // Should fall back to default
      expect(result.current.viewMode).toBe('grid');
    });

    it('should handle localStorage.setItem throwing an error', () => {
      setWindowWidth(1024);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      const { result } = renderHook(() => useViewModePreference());

      // Should not throw when setting
      expect(() => {
        act(() => {
          result.current.setViewMode('compact');
        });
      }).not.toThrow();

      // State should still update even if storage fails
      expect(result.current.viewMode).toBe('compact');
    });
  });
});
