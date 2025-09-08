import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { BandProvider, useBand } from './BandContext';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  getDocs: vi.fn(),
  where: vi.fn(),
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

// Mock useRole hook
const mockRoles = {
  admin: false,
  bandManager: false,
  bandMember: true,
};

vi.mock('../hooks/useRole', () => ({
  useRole: () => ({
    roles: mockRoles,
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Test component that uses BandContext
const TestComponent = () => {
  const {
    bandMembers,
    instruments,
    addBandMember,
    removeBandMember,
    updateMemberInstrument,
    updateMemberName,
    addInstrument,
    removeInstrument,
    isInstrumentInUse,
    loading,
  } = useBand();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="band-members-count">{bandMembers.length}</div>
      <div data-testid="instruments-count">{instruments.length}</div>
      
      <div data-testid="band-members">
        {bandMembers.map(member => (
          <div key={member.id} data-testid={`member-${member.id}`}>
            {member.name} - {member.instrument}
          </div>
        ))}
      </div>
      
      <div data-testid="instruments">
        {instruments.map(instrument => (
          <div key={instrument} data-testid={`instrument-${instrument}`}>
            {instrument} - {isInstrumentInUse(instrument) ? 'In use' : 'Available'}
          </div>
        ))}
      </div>
      
      <button onClick={() => addBandMember({ name: 'New Member', instrument: 'Guitar' })}>
        Add Member
      </button>
      <button onClick={() => removeBandMember('member1')}>
        Remove Member
      </button>
      <button onClick={() => updateMemberInstrument('member1', 'Bass')}>
        Update Instrument
      </button>
      <button onClick={() => updateMemberName('member1', 'Updated Name')}>
        Update Name
      </button>
      <button onClick={() => addInstrument('Piano')}>
        Add Instrument
      </button>
      <button onClick={() => removeInstrument('Guitar')}>
        Remove Instrument
      </button>
    </div>
  );
};

// Custom render for these specific tests
const renderWithBandProvider = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <BandProvider>{ui}</BandProvider>
    </BrowserRouter>
  );
};

describe('BandContext', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset mock roles
    mockRoles.admin = false;
    mockRoles.bandManager = false;
    mockRoles.bandMember = true;
    
    // Mock default Firestore calls
    const { collection, query, doc, setDoc, updateDoc, deleteDoc, getDocs } = await import('firebase/firestore');
    vi.mocked(collection).mockReturnValue('mock-collection' as any);
    vi.mocked(query).mockReturnValue('mock-query' as any);
    vi.mocked(doc).mockReturnValue({ id: 'mock-doc-id', ref: 'mock-doc-ref' } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ id: 'member1', name: 'Test Member', instrument: 'Guitar' }) }]
    } as any);
  });

  it('should provide initial loading state', async () => {
    // Mock onSnapshot to not call callback immediately
    const { onSnapshot } = await import('firebase/firestore');
    vi.mocked(onSnapshot).mockImplementation(() => vi.fn());
    
    renderWithBandProvider(<TestComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render band members when loaded', async () => {
    const mockMembers = [
      { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
      { id: 'member2', name: 'Jane Smith', instrument: 'Bass' },
    ];

    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot for band members
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      const snapshot = {
        docs: mockMembers.map(member => ({
          id: member.id,
          data: () => member,
        })),
      };
      callback(snapshot);
      return vi.fn(); // unsubscribe
    });
    
    // Mock onSnapshot for instruments
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      const snapshot = {
        docs: [
          { data: () => ({ name: 'Guitar' }) },
          { data: () => ({ name: 'Bass' }) },
        ],
      };
      callback(snapshot);
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('band-members-count')).toHaveTextContent('2');
      expect(screen.getByTestId('member-member1')).toHaveTextContent('John Doe - Guitar');
      expect(screen.getByTestId('member-member2')).toHaveTextContent('Jane Smith - Bass');
    });
  });

  it('should render instruments when loaded', async () => {
    const mockInstruments = ['Guitar', 'Bass', 'Drums'];
    const mockMembers = [
      { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
    ];

    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot for band members
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      const snapshot = {
        docs: mockMembers.map(member => ({
          id: member.id,
          data: () => member,
        })),
      };
      callback(snapshot);
      return vi.fn();
    });
    
    // Mock onSnapshot for instruments
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      const snapshot = {
        docs: mockInstruments.map(instrument => ({
          data: () => ({ name: instrument }),
        })),
      };
      callback(snapshot);
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('instruments-count')).toHaveTextContent('3');
      expect(screen.getByTestId('instrument-Guitar')).toHaveTextContent('Guitar - In use');
      expect(screen.getByTestId('instrument-Bass')).toHaveTextContent('Bass - Available');
      expect(screen.getByTestId('instrument-Drums')).toHaveTextContent('Drums - Available');
    });
  });

  it('should handle adding a band member with manager permissions', async () => {
    // Set manager permissions
    mockRoles.bandManager = true;
    
    const { doc, setDoc, onSnapshot } = await import('firebase/firestore');
    
    // Mock successful member creation
    vi.mocked(doc).mockReturnValue({ id: 'new-member-id' } as any);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    
    // Mock onSnapshot to return empty initially
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const addButton = screen.getByText('Add Member');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        { id: 'new-member-id' },
        {
          id: 'new-member-id',
          name: 'New Member',
          instrument: 'Guitar',
          createdBy: mockAuthUser.uid,
        }
      );
    });
  });

  it('should handle removing a band member with manager permissions', async () => {
    // Set manager permissions
    mockRoles.bandManager = true;
    
    const { deleteDoc, onSnapshot } = await import('firebase/firestore');
    
    vi.mocked(deleteDoc).mockResolvedValue(undefined);
    
    // Mock onSnapshot to return members
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading..')).not.toBeInTheDocument();
    });

    const removeButton = screen.getByText('Remove Member');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  it('should handle updating member instrument', async () => {
    const { updateDoc, getDocs, onSnapshot } = await import('firebase/firestore');
    
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ id: 'member1' }) }]
    } as any);
    
    // Mock onSnapshot to return empty
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const updateInstrumentButton = screen.getByText('Update Instrument');
    fireEvent.click(updateInstrumentButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { instrument: 'Bass' });
    });
  });

  it('should handle updating member name', async () => {
    const { updateDoc, getDocs, onSnapshot } = await import('firebase/firestore');
    
    vi.mocked(updateDoc).mockResolvedValue(undefined);
    vi.mocked(getDocs).mockResolvedValue({
      empty: false,
      docs: [{ data: () => ({ id: 'member1' }) }]
    } as any);
    
    // Mock onSnapshot to return empty
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const updateNameButton = screen.getByText('Update Name');
    fireEvent.click(updateNameButton);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', { name: 'Updated Name' });
    });
  });

  it('should handle adding an instrument with manager permissions', async () => {
    // Set manager permissions
    mockRoles.bandManager = true;
    
    const { setDoc, onSnapshot } = await import('firebase/firestore');
    
    vi.mocked(setDoc).mockResolvedValue(undefined);
    
    // Mock onSnapshot to return instruments that don't include Piano
    vi.mocked(onSnapshot).mockImplementation((query, callback, errorCallback, isFirstCall = true) => {
      if (isFirstCall) {
        // First call is for band members
        callback({ docs: [] });
        vi.mocked(onSnapshot).mockImplementation((query, callback) => {
          // Second call is for instruments
          callback({ 
            docs: [
              { data: () => ({ name: 'Guitar' }) },
              { data: () => ({ name: 'Bass' }) }
            ] 
          });
          return vi.fn();
        });
      }
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const addInstrumentButton = screen.getByText('Add Instrument');
    fireEvent.click(addInstrumentButton);

    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(
        { id: 'mock-doc-id' },
        { name: 'Piano' }
      );
    });
  });

  it('should handle removing an instrument with manager permissions', async () => {
    // Set manager permissions  
    mockRoles.bandManager = true;
    
    const { getDocs, deleteDoc, onSnapshot } = await import('firebase/firestore');
    
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ ref: 'mock-doc-ref' }]
    } as any);
    vi.mocked(deleteDoc).mockResolvedValue(undefined);
    
    // Mock onSnapshot to return empty
    vi.mocked(onSnapshot).mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const removeInstrumentButton = screen.getByText('Remove Instrument');
    fireEvent.click(removeInstrumentButton);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
    });
  });

  it('should correctly identify instruments in use', async () => {
    const mockMembers = [
      { id: 'member1', name: 'John Doe', instrument: 'Guitar' },
      { id: 'member2', name: 'Jane Smith', instrument: 'Bass' },
    ];
    const mockInstruments = ['Guitar', 'Bass', 'Drums'];

    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot for band members
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      callback({
        docs: mockMembers.map(member => ({
          id: member.id,
          data: () => member,
        })),
      });
      return vi.fn();
    });
    
    // Mock onSnapshot for instruments  
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      callback({
        docs: mockInstruments.map(instrument => ({
          data: () => ({ name: instrument }),
        })),
      });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('instrument-Guitar')).toHaveTextContent('Guitar - In use');
      expect(screen.getByTestId('instrument-Bass')).toHaveTextContent('Bass - In use');
      expect(screen.getByTestId('instrument-Drums')).toHaveTextContent('Drums - Available');
    });
  });

  it('should handle Firestore errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { onSnapshot } = await import('firebase/firestore');
    
    // Mock onSnapshot to trigger error callback
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback, errorCallback) => {
      errorCallback(new Error('Firestore error'));
      return vi.fn();
    });
    
    // Mock second onSnapshot for instruments to complete loading
    vi.mocked(onSnapshot).mockImplementationOnce((query, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });

    renderWithBandProvider(<TestComponent />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching band members:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('should throw error when useBand is used outside provider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useBand must be used within a BandProvider');
    
    consoleErrorSpy.mockRestore();
  });
});