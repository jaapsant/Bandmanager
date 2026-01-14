import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmailsForUserIds, getAllUserEmails } from './emailService';

// Mock Firebase Firestore
const mockGetDocs = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockDocumentId = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  documentId: () => mockDocumentId(),
}));

vi.mock('../lib/firebase', () => ({
  db: {},
}));

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('users-collection');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-clause');
    mockDocumentId.mockReturnValue('__name__');
  });

  describe('getEmailsForUserIds', () => {
    it('should return empty array for empty userIds', async () => {
      const result = await getEmailsForUserIds([]);

      expect(result).toEqual([]);
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('should fetch emails for given user IDs', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'user-1', data: () => ({ email: 'user1@example.com' }) },
          { id: 'user-2', data: () => ({ email: 'user2@example.com' }) },
        ],
      });

      const result = await getEmailsForUserIds(['user-1', 'user-2']);

      expect(result).toEqual(['user1@example.com', 'user2@example.com']);
      expect(mockQuery).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalledWith('__name__', 'in', ['user-1', 'user-2']);
    });

    it('should skip users without email', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'user-1', data: () => ({ email: 'user1@example.com' }) },
          { id: 'user-2', data: () => ({ name: 'User without email' }) },
          { id: 'user-3', data: () => ({ email: '' }) },
        ],
      });

      const result = await getEmailsForUserIds(['user-1', 'user-2', 'user-3']);

      expect(result).toEqual(['user1@example.com']);
    });

    it('should batch queries for more than 30 user IDs', async () => {
      // Create 35 user IDs
      const userIds = Array.from({ length: 35 }, (_, i) => `user-${i + 1}`);

      // First batch returns 30 users
      const firstBatchDocs = Array.from({ length: 30 }, (_, i) => ({
        id: `user-${i + 1}`,
        data: () => ({ email: `user${i + 1}@example.com` }),
      }));

      // Second batch returns 5 users
      const secondBatchDocs = Array.from({ length: 5 }, (_, i) => ({
        id: `user-${i + 31}`,
        data: () => ({ email: `user${i + 31}@example.com` }),
      }));

      mockGetDocs
        .mockResolvedValueOnce({ docs: firstBatchDocs })
        .mockResolvedValueOnce({ docs: secondBatchDocs });

      const result = await getEmailsForUserIds(userIds);

      // Should have made 2 queries
      expect(mockGetDocs).toHaveBeenCalledTimes(2);

      // First batch should have 30 IDs
      expect(mockWhere).toHaveBeenNthCalledWith(
        1,
        '__name__',
        'in',
        userIds.slice(0, 30)
      );

      // Second batch should have 5 IDs
      expect(mockWhere).toHaveBeenNthCalledWith(
        2,
        '__name__',
        'in',
        userIds.slice(30, 35)
      );

      // Should return all 35 emails
      expect(result).toHaveLength(35);
    });

    it('should handle exactly 30 user IDs in single batch', async () => {
      const userIds = Array.from({ length: 30 }, (_, i) => `user-${i + 1}`);
      const docs = userIds.map(id => ({
        id,
        data: () => ({ email: `${id}@example.com` }),
      }));

      mockGetDocs.mockResolvedValue({ docs });

      const result = await getEmailsForUserIds(userIds);

      expect(mockGetDocs).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(30);
    });

    it('should handle users that do not exist (empty response)', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const result = await getEmailsForUserIds(['non-existent-user']);

      expect(result).toEqual([]);
    });

    it('should handle partial matches (some users exist, some do not)', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { id: 'user-1', data: () => ({ email: 'user1@example.com' }) },
          // user-2 doesn't exist, so not in response
        ],
      });

      const result = await getEmailsForUserIds(['user-1', 'user-2']);

      expect(result).toEqual(['user1@example.com']);
    });
  });

  describe('getAllUserEmails', () => {
    it('should fetch all user emails', async () => {
      const mockForEach = vi.fn((callback: (doc: { data: () => { email?: string } }) => void) => {
        [
          { data: () => ({ email: 'user1@example.com' }) },
          { data: () => ({ email: 'user2@example.com' }) },
          { data: () => ({ email: 'user3@example.com' }) },
        ].forEach(callback);
      });

      mockGetDocs.mockResolvedValue({ forEach: mockForEach });

      const result = await getAllUserEmails();

      expect(result).toEqual([
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ]);
    });

    it('should skip users without email', async () => {
      const mockForEach = vi.fn((callback: (doc: { data: () => { email?: string } }) => void) => {
        [
          { data: () => ({ email: 'user1@example.com' }) },
          { data: () => ({ name: 'No email user' }) },
          { data: () => ({ email: '' }) },
          { data: () => ({ email: 'user2@example.com' }) },
        ].forEach(callback);
      });

      mockGetDocs.mockResolvedValue({ forEach: mockForEach });

      const result = await getAllUserEmails();

      expect(result).toEqual(['user1@example.com', 'user2@example.com']);
    });

    it('should return empty array when no users exist', async () => {
      const mockForEach = vi.fn();
      mockGetDocs.mockResolvedValue({ forEach: mockForEach });

      const result = await getAllUserEmails();

      expect(result).toEqual([]);
    });
  });
});
