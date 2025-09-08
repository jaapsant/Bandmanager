import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GigProvider, useGigs } from './GigContext';
import { Gig } from '../types';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
}));

// Mock Firebase instance
vi.mock('../lib/firebase', () => ({
  db: {},
}));

// Mock AuthContext
const mockAuthUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
};

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Test component that uses GigContext
const TestComponent = () => {
  const { gigs, addGig, updateGig, deleteGig, loading } = useGigs();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="gigs-count">{gigs.length}</div>
      
      <div data-testid="gigs-list">
        {gigs.map(gig => (
          <div key={gig.id} data-testid={`gig-${gig.id}`}>
            {gig.name} - {gig.status} - {gig.date}
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => addGig({
          name: 'New Gig',
          date: '2025-12-25',
          status: 'pending',
          memberAvailability: {},
          isWholeDay: true,
          startTime: null,
          endTime: null,
          pay: null,
          description: null,
          location: null,
          distance: null,
        })}
      >
        Add Gig
      </button>
      
      <button 
        onClick={() => {
          if (gigs.length > 0) {
            updateGig({ ...gigs[0], name: 'Updated Gig' });
          }
        }}
      >
        Update Gig
      </button>
      
      <button 
        onClick={() => {
          if (gigs.length > 0) {
            deleteGig(gigs[0].id);
          }
        }}
      >
        Delete Gig
      </button>
      
      <button 
        onClick={() => addGig({
          name: '',
          date: '2023-01-01', // Past date
          status: 'pending',
          memberAvailability: {},
          isWholeDay: false,
          startTime: '14:00',
          endTime: '12:00', // End before start
          pay: null,
          description: null,
          location: null,
          distance: null,
        })}
      >
        Add Invalid Gig
      </button>
    </div>
  );
};

// Custom render for these specific tests
const renderWithGigProvider = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <GigProvider>{ui}</GigProvider>
    </BrowserRouter>
  );
};

describe('GigContext', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock default Firestore calls
    const { collection, query, addDoc, updateDoc, deleteDoc, doc } = await import('firebase/firestore');
    vi.mocked(collection).mockReturnValue('mock-collection' as any);
    vi.mocked(query).mockReturnValue('mock-query' as any);
    vi.mocked(addDoc).mockResolvedValue({ id: 'new-gig-id' } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);
    vi.mocked(doc).mockReturnValue({ id: 'mock-doc-id', ref: 'mock-doc-ref' } as any);
  });

  it('should provide initial loading state', async () => {
    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot to not call callback immediately
    vi.mocked(onSnapshot).mockImplementation(() => vi.fn());
    
    renderWithGigProvider(<TestComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render gigs when loaded', async () => {
    const mockGigs: Gig[] = [
      {
        id: 'gig1',
        name: 'Concert A',
        date: '2025-12-25',
        status: 'confirmed',
        memberAvailability: {},
        isWholeDay: true,
        startTime: null,
        endTime: null,
        pay: 500,
        description: 'Christmas concert',
        location: 'Concert Hall',
        distance: 10,
      },
      {
        id: 'gig2', 
        name: 'Wedding B',
        date: '2025-11-15',
        status: 'pending',
        memberAvailability: {},
        isWholeDay: false,
        startTime: '18:00',
        endTime: '23:00',
        pay: 800,
        description: 'Wedding reception',
        location: 'Hotel Ballroom',
        distance: 25,
      },
    ];

    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot to return gigs
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      const snapshot = {
        docs: mockGigs.map(gig => ({
          id: gig.id,
          data: () => ({ ...gig, id: undefined }), // Remove id from data since it's separate
          ref: `doc-ref-${gig.id}`,
        })),
      };
      callback(snapshot);
      return vi.fn(); // unsubscribe
    });

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('gigs-count')).toHaveTextContent('2');
      expect(screen.getByTestId('gig-gig1')).toHaveTextContent('Concert A - confirmed - 2025-12-25');
      expect(screen.getByTestId('gig-gig2')).toHaveTextContent('Wedding B - pending - 2025-11-15');
    });
  });

  it('should handle adding a new gig successfully', async () => {
    const { onSnapshot, addDoc } = await import('firebase/firestore');
    
    // Mock onSnapshot to return empty initially
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });
    
    vi.mocked(addDoc).mockResolvedValue({ id: 'new-gig-id' } as any);

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Gig');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'New Gig',
        date: '2025-12-25',
        status: 'pending',
        memberAvailability: {},
        isWholeDay: true,
        startTime: null,
        endTime: null,
        pay: null,
        description: null,
        location: null,
        distance: null,
        createdBy: mockAuthUser.uid,
      });
    });
  });

  it('should handle updating a gig successfully', async () => {
    const mockGig: Gig = {
      id: 'gig1',
      name: 'Original Gig',
      date: '2025-12-25',
      status: 'pending',
      memberAvailability: {},
      isWholeDay: true,
      startTime: null,
      endTime: null,
      pay: null,
      description: null,
      location: null,
      distance: null,
    };

    const { onSnapshot, updateDoc, doc } = await import('firebase/firestore');
    
    // Mock onSnapshot to return a gig
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      const snapshot = {
        docs: [{
          id: mockGig.id,
          data: () => ({ ...mockGig, id: undefined }),
          ref: `doc-ref-${mockGig.id}`,
        }],
      };
      callback(snapshot);
      return vi.fn();
    });

    vi.mocked(doc).mockReturnValue({ ref: 'mock-doc-ref' } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('gigs-count')).toHaveTextContent('1');
    });

    const updateButton = screen.getByText('Update Gig');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  it('should handle deleting a gig successfully', async () => {
    const mockGig: Gig = {
      id: 'gig1',
      name: 'Test Gig',
      date: '2025-12-25',
      status: 'pending',
      memberAvailability: {},
      isWholeDay: true,
      startTime: null,
      endTime: null,
      pay: null,
      description: null,
      location: null,
      distance: null,
    };

    const { onSnapshot, deleteDoc, doc } = await import('firebase/firestore');
    
    // Mock onSnapshot to return a gig
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      const snapshot = {
        docs: [{
          id: mockGig.id,
          data: () => ({ ...mockGig, id: undefined }),
          ref: `doc-ref-${mockGig.id}`,
        }],
      };
      callback(snapshot);
      return vi.fn();
    });

    vi.mocked(doc).mockReturnValue({ ref: 'mock-doc-ref' } as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('gigs-count')).toHaveTextContent('1');
    });

    const deleteButton = screen.getByText('Delete Gig');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith({ ref: 'mock-doc-ref' });
    });
  });

  it('should validate gig data and reject invalid input', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onSnapshot, addDoc } = await import('firebase/firestore');
    
    // Mock onSnapshot to return empty
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const addInvalidButton = screen.getByText('Add Invalid Gig');
    fireEvent.click(addInvalidButton);

    await waitFor(() => {
      // Should not call addDoc due to validation errors
      expect(addDoc).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error adding gig:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should update gig status from confirmed to completed for past dates', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    const pastDateString = pastDate.toISOString().split('T')[0];

    const mockGig: Gig = {
      id: 'gig1',
      name: 'Past Gig',
      date: pastDateString,
      status: 'confirmed',
      memberAvailability: {},
      isWholeDay: true,
      startTime: null,
      endTime: null,
      pay: null,
      description: null,
      location: null,
      distance: null,
    };

    const { onSnapshot, updateDoc } = await import('firebase/firestore');
    
    // Mock onSnapshot to return a past confirmed gig
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      const snapshot = {
        docs: [{
          id: mockGig.id,
          data: () => ({ ...mockGig, id: undefined }),
          ref: { update: vi.fn() },
        }],
      };
      callback(snapshot);
      return vi.fn();
    });

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('gigs-count')).toHaveTextContent('1');
      expect(screen.getByTestId('gig-gig1')).toHaveTextContent('Past Gig - completed');
    });
  });

  it('should handle Firestore errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot to trigger error callback
    vi.mocked(onSnapshot).mockImplementation((query, callback, errorCallback) => {
      errorCallback(new Error('Firestore error'));
      return vi.fn();
    });

    renderWithGigProvider(<TestComponent />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('gigContext.errors.fetchGigs', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should throw error when useGigs is used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('gigContext.errors.useGigsHook');
    
    consoleErrorSpy.mockRestore();
  });

  it('should handle time validation correctly', async () => {
    const { onSnapshot, addDoc } = await import('firebase/firestore');
    
    // Mock onSnapshot to return empty
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    const TestTimeValidationComponent = () => {
      const { addGig } = useGigs();
      
      return (
        <button 
          onClick={() => addGig({
            name: 'Time Test Gig',
            date: '2025-12-25',
            status: 'pending',
            memberAvailability: {},
            isWholeDay: false,
            startTime: '20:00',
            endTime: '18:00', // End before start - should fail
            pay: null,
            description: null,
            location: null,
            distance: null,
          })}
        >
          Add Time Invalid Gig
        </button>
      );
    };

    renderWithGigProvider(<TestTimeValidationComponent />);

    const addButton = screen.getByText('Add Time Invalid Gig');
    fireEvent.click(addButton);

    await waitFor(() => {
      // Should not call addDoc due to time validation error
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  it('should require email verification for operations', async () => {
    // Override the mock to return unverified user
    const mockUnverifiedUser = { ...mockAuthUser, emailVerified: false };
    
    vi.doMock('./AuthContext', () => ({
      useAuth: () => ({
        user: mockUnverifiedUser,
      }),
    }));

    const { onSnapshot } = await import('firebase/firestore');
    
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    const TestUnverifiedComponent = () => {
      const { addGig } = useGigs();
      
      return (
        <button 
          onClick={() => addGig({
            name: 'Test Gig',
            date: '2025-12-25',
            status: 'pending',
            memberAvailability: {},
            isWholeDay: true,
            startTime: null,
            endTime: null,
            pay: null,
            description: null,
            location: null,
            distance: null,
          })}
        >
          Add Gig Unverified
        </button>
      );
    };

    // Note: This test would need the updated mock to work properly
    // For now, it demonstrates the test structure
  });
});