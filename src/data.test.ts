import { describe, it, expect, vi } from 'vitest';
import { useStatusOptions } from './data';
import { renderHook } from '@testing-library/react';

// Mock useTranslation
const mockT = vi.fn((key: string) => key);
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

describe('data utilities', () => {
  describe('useStatusOptions', () => {
    it('should return status options with translations', () => {
      const { result } = renderHook(() => useStatusOptions());
      
      expect(result.current).toHaveLength(3);
      expect(result.current[0]).toEqual({
        value: 'pending',
        label: 'gigs.status.pending',
        color: 'bg-yellow-100 text-yellow-800',
      });
      expect(result.current[1]).toEqual({
        value: 'confirmed',
        label: 'gigs.status.confirmed',
        color: 'bg-green-100 text-green-800',
      });
      expect(result.current[2]).toEqual({
        value: 'declined',
        label: 'gigs.status.declined',
        color: 'bg-red-100 text-red-800',
      });
    });

    it('should call translation function for each status', () => {
      renderHook(() => useStatusOptions());
      
      expect(mockT).toHaveBeenCalledWith('gigs.status.pending');
      expect(mockT).toHaveBeenCalledWith('gigs.status.confirmed');
      expect(mockT).toHaveBeenCalledWith('gigs.status.declined');
    });
  });
});