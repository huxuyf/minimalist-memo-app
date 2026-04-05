import { describe, it, expect, beforeEach, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createMemo,
  getAllMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
  updateMemoSyncStatus,
  getPendingMemos,
  SyncStatus,
} from './storage';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

describe('Storage Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMemo', () => {
    it('should create a new memo with pending sync status', async () => {
      const mockMemos = JSON.stringify([]);
      (AsyncStorage.getItem as any).mockResolvedValue(mockMemos);
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      const memo = await createMemo('Test Title', 'Test Content');

      expect(memo.title).toBe('Test Title');
      expect(memo.content).toBe('Test Content');
      expect(memo.syncStatus).toBe(SyncStatus.PENDING);
      expect(memo.id).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should increment memo id correctly', async () => {
      const existingMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
        { id: 2, title: 'Memo 2', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(existingMemos));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      const memo = await createMemo('Memo 3');

      expect(memo.id).toBe(3);
    });
  });

  describe('getAllMemos', () => {
    it('should return empty array when no memos exist', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      const memos = await getAllMemos();

      expect(memos).toEqual([]);
    });

    it('should return memos sorted by createTime descending', async () => {
      const now = Date.now();
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: now - 1000, syncStatus: 0 },
        { id: 2, title: 'Memo 2', content: '', createTime: now, syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));

      const memos = await getAllMemos();

      expect(memos[0].id).toBe(2); // Most recent first
      expect(memos[1].id).toBe(1);
    });
  });

  describe('getMemoById', () => {
    it('should return memo by id', async () => {
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
        { id: 2, title: 'Memo 2', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));

      const memo = await getMemoById(1);

      expect(memo?.id).toBe(1);
      expect(memo?.title).toBe('Memo 1');
    });

    it('should return null if memo not found', async () => {
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));

      const memo = await getMemoById(999);

      expect(memo).toBeNull();
    });
  });

  describe('updateMemo', () => {
    it('should update memo and mark as pending sync', async () => {
      const mockMemos = [
        { id: 1, title: 'Old Title', content: '', createTime: Date.now(), syncStatus: 1 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      const updated = await updateMemo(1, 'New Title', 'New Content');

      expect(updated?.title).toBe('New Title');
      expect(updated?.content).toBe('New Content');
      expect(updated?.syncStatus).toBe(SyncStatus.PENDING);
    });

    it('should return null if memo not found', async () => {
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));

      const updated = await updateMemo(999, 'New Title');

      expect(updated).toBeNull();
    });
  });

  describe('deleteMemo', () => {
    it('should delete memo by id', async () => {
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
        { id: 2, title: 'Memo 2', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      const result = await deleteMemo(1);

      expect(result).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'memos',
        expect.stringContaining('"id":2')
      );
    });
  });

  describe('updateMemoSyncStatus', () => {
    it('should update sync status', async () => {
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));
      (AsyncStorage.setItem as any).mockResolvedValue(undefined);

      const updated = await updateMemoSyncStatus(1, SyncStatus.SUCCESS, 'msg-123');

      expect(updated?.syncStatus).toBe(SyncStatus.SUCCESS);
      expect(updated?.emailMessageId).toBe('msg-123');
    });
  });

  describe('getPendingMemos', () => {
    it('should return only pending memos', async () => {
      const mockMemos = [
        { id: 1, title: 'Memo 1', content: '', createTime: Date.now(), syncStatus: 0 },
        { id: 2, title: 'Memo 2', content: '', createTime: Date.now(), syncStatus: 1 },
        { id: 3, title: 'Memo 3', content: '', createTime: Date.now(), syncStatus: 0 },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockMemos));

      const pending = await getPendingMemos();

      expect(pending).toHaveLength(2);
      expect(pending.every(m => m.syncStatus === 0)).toBe(true);
    });
  });
});
