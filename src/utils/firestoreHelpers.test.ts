import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrCreateMemberDoc, updateOrCreateMember } from './firestoreHelpers';

// Mock Firebase Firestore
const mockSetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  doc: (...args: unknown[]) => mockDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  where: (...args: unknown[]) => mockWhere(...args),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

describe('firestoreHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('collection-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
  });

  describe('getOrCreateMemberDoc', () => {
    it('should return existing document when member exists', async () => {
      const mockDocRef = { id: 'existing-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ ref: mockDocRef }],
      });

      const result = await getOrCreateMemberDoc('user-123', {
        name: 'Test User',
        createdBy: 'admin-123',
      });

      expect(result.exists).toBe(true);
      expect(result.docRef).toBe(mockDocRef);
      expect(mockSetDoc).not.toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('id', '==', 'user-123');
    });

    it('should create new document when member does not exist', async () => {
      const mockNewDocRef = { id: 'new-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });
      mockDoc.mockReturnValue(mockNewDocRef);
      mockSetDoc.mockResolvedValue(undefined);

      const result = await getOrCreateMemberDoc('user-456', {
        name: 'New User',
        createdBy: 'admin-123',
      });

      expect(result.exists).toBe(false);
      expect(result.docRef).toBe(mockNewDocRef);
      expect(mockSetDoc).toHaveBeenCalledWith(mockNewDocRef, {
        id: 'user-456',
        name: 'New User',
        instrument: '',
        createdBy: 'admin-123',
      });
    });

    it('should handle member creation without createdBy field', async () => {
      const mockNewDocRef = { id: 'new-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });
      mockDoc.mockReturnValue(mockNewDocRef);
      mockSetDoc.mockResolvedValue(undefined);

      await getOrCreateMemberDoc('user-789', {
        name: 'User Without Creator',
      });

      expect(mockSetDoc).toHaveBeenCalledWith(mockNewDocRef, {
        id: 'user-789',
        name: 'User Without Creator',
        instrument: '',
        createdBy: undefined,
      });
    });
  });

  describe('updateOrCreateMember', () => {
    it('should update existing member document', async () => {
      const mockDocRef = { id: 'existing-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ ref: mockDocRef }],
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateOrCreateMember(
        'user-123',
        { instrument: 'Guitar' },
        { name: 'Test User', createdBy: 'admin-123' }
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, { instrument: 'Guitar' });
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('should create and update new member document', async () => {
      const mockNewDocRef = { id: 'new-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });
      mockDoc.mockReturnValue(mockNewDocRef);
      mockSetDoc.mockResolvedValue(undefined);
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateOrCreateMember(
        'user-456',
        { instrument: 'Drums', wantsPrintedSheetMusic: true },
        { name: 'New User', createdBy: 'admin-123' }
      );

      // First, setDoc is called to create the document
      expect(mockSetDoc).toHaveBeenCalledWith(mockNewDocRef, {
        id: 'user-456',
        name: 'New User',
        instrument: '',
        createdBy: 'admin-123',
      });

      // Then, updateDoc is called with the update data
      expect(mockUpdateDoc).toHaveBeenCalledWith(mockNewDocRef, {
        instrument: 'Drums',
        wantsPrintedSheetMusic: true,
      });
    });

    it('should handle updating driving preferences', async () => {
      const mockDocRef = { id: 'existing-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ ref: mockDocRef }],
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      const drivingPreferences = {
        canDrive: true,
        availableSeats: 3,
        hasWinterTyres: true,
        hasEnvironmentSticker: false,
        remarks: 'Available for longer trips',
      };

      await updateOrCreateMember(
        'user-123',
        { drivingAvailability: drivingPreferences },
        { name: 'Test User' }
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        drivingAvailability: drivingPreferences,
      });
    });

    it('should handle updating member name', async () => {
      const mockDocRef = { id: 'existing-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ ref: mockDocRef }],
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateOrCreateMember(
        'user-123',
        { name: 'Updated Name' },
        { name: 'Updated Name', createdBy: 'user-123' }
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, { name: 'Updated Name' });
    });

    it('should handle multiple field updates at once', async () => {
      const mockDocRef = { id: 'existing-doc-id' };
      mockGetDocs.mockResolvedValue({
        empty: false,
        docs: [{ ref: mockDocRef }],
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      await updateOrCreateMember(
        'user-123',
        {
          instrument: 'Saxophone',
          wantsPrintedSheetMusic: false,
          name: 'Updated Name',
        },
        { name: 'Updated Name' }
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(mockDocRef, {
        instrument: 'Saxophone',
        wantsPrintedSheetMusic: false,
        name: 'Updated Name',
      });
    });
  });
});
