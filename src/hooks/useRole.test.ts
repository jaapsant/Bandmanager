import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRole } from './useRole';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => 'mock-doc-ref'),
  getDoc: vi.fn(),
  getFirestore: vi.fn(() => ({})),
}));

// Mock Auth Context
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('useRole hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty roles and loading false when user is not authenticated', async () => {
    const { useAuth } = await import('../context/AuthContext');
    vi.mocked(useAuth).mockReturnValue({ user: null });

    const { result } = renderHook(() => useRole());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  it('should fetch and return user roles when user is authenticated', async () => {
    const mockUser = { uid: 'user123' };
    const mockRoles = { admin: true, bandManager: false, bandMember: true };
    
    const { useAuth } = await import('../context/AuthContext');
    const { getDoc } = await import('firebase/firestore');
    
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(getDoc).mockResolvedValue({
      data: () => mockRoles,
    } as any);

    const { result } = renderHook(() => useRole());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual(mockRoles);
    expect(result.current.loading).toBe(false);
  });

  it('should return empty roles when document does not exist', async () => {
    const mockUser = { uid: 'user123' };
    
    const { useAuth } = await import('../context/AuthContext');
    const { getDoc } = await import('firebase/firestore');
    
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(getDoc).mockResolvedValue({
      data: () => null,
    } as any);

    const { result } = renderHook(() => useRole());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.roles).toEqual({});
    expect(result.current.loading).toBe(false);
  });

  it('should handle fetch error gracefully', async () => {
    const mockUser = { uid: 'user123' };
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { useAuth } = await import('../context/AuthContext');
    const { getDoc } = await import('firebase/firestore');
    
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(getDoc).mockRejectedValue(new Error('Fetch failed'));

    const { result } = renderHook(() => useRole());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.roles).toEqual({});
    expect(result.current.loading).toBe(false);

    consoleSpy.mockRestore();
  });
});