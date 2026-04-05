import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAndSyncMemo,
  updateAndSyncMemo,
  deleteMemoRecord,
  retrySyncPendingMemos,
  saveEmailConfiguration,
  getEmailConfiguration,
  testEmailConfiguration,
  recoverFromMailbox,
  fetchAllMemos,
  fetchMemoById,
} from './repository';
import * as storage from './storage';
import * as emailService from '../email/service';

// Mock storage module
vi.mock('./storage', () => ({
  createMemo: vi.fn(),
  updateMemo: vi.fn(),
  deleteMemo: vi.fn(),
  updateMemoSyncStatus: vi.fn(),
  getPendingMemos: vi.fn(),
  getAllMemos: vi.fn(),
  getMemoById: vi.fn(),
  getEmailConfig: vi.fn(),
  saveEmailConfig: vi.fn(),
  deleteEmailConfig: vi.fn(),
  importMemos: vi.fn(),
  clearAllMemos: vi.fn(),
}));

// Mock email service
vi.mock('../email/service', () => ({
  sendEmail: vi.fn(),
  testEmailConfig: vi.fn(),
  fetchEmailsFromMailbox: vi.fn(),
  validateEmailConfig: vi.fn(),
}));

describe('Repository Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAndSyncMemo', () => {
    it('should create memo and sync successfully', async () => {
      const mockMemo = {
        id: 1,
        title: 'Test',
        content: 'Content',
        createTime: Date.now(),
        syncStatus: 0,
      };

      const mockConfig = {
        recipientEmail: 'user@example.com',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      (storage.createMemo as any).mockResolvedValue(mockMemo);
      (storage.getEmailConfig as any).mockResolvedValue(mockConfig);
      (emailService.validateEmailConfig as any).mockReturnValue(true);
      (emailService.sendEmail as any).mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      });
      (storage.updateMemoSyncStatus as any).mockResolvedValue({
        ...mockMemo,
        syncStatus: 1,
      });

      const result = await createAndSyncMemo('Test', 'Content');

      expect(result.memo.id).toBe(1);
      expect(result.syncSuccess).toBe(true);
      expect(storage.createMemo).toHaveBeenCalledWith('Test', 'Content');
    });

    it('should create memo but mark as pending if sync fails', async () => {
      const mockMemo = {
        id: 1,
        title: 'Test',
        content: 'Content',
        createTime: Date.now(),
        syncStatus: 0,
      };

      const mockConfig = {
        recipientEmail: 'user@example.com',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      (storage.createMemo as any).mockResolvedValue(mockMemo);
      (storage.getEmailConfig as any).mockResolvedValue(mockConfig);
      (emailService.validateEmailConfig as any).mockReturnValue(true);
      (emailService.sendEmail as any).mockResolvedValue({
        success: false,
        error: 'Network error',
      });
      (storage.updateMemoSyncStatus as any).mockResolvedValue({
        ...mockMemo,
        syncStatus: 0,
      });

      const result = await createAndSyncMemo('Test', 'Content');

      expect(result.memo.id).toBe(1);
      expect(result.syncSuccess).toBe(false);
      expect(result.syncError).toBe('Network error');
    });
  });

  describe('deleteMemoRecord', () => {
    it('should delete memo', async () => {
      (storage.deleteMemo as any).mockResolvedValue(true);

      const result = await deleteMemoRecord(1);

      expect(result).toBe(true);
      expect(storage.deleteMemo).toHaveBeenCalledWith(1);
    });
  });

  describe('saveEmailConfiguration', () => {
    it('should save valid email config', async () => {
      const config = {
        recipientEmail: 'user@example.com',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      (emailService.validateEmailConfig as any).mockReturnValue(true);
      (storage.saveEmailConfig as any).mockResolvedValue(undefined);

      await saveEmailConfiguration(config);

      expect(storage.saveEmailConfig).toHaveBeenCalledWith(config);
    });

    it('should reject invalid email config', async () => {
      const config = {
        recipientEmail: 'invalid',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      (emailService.validateEmailConfig as any).mockReturnValue(false);

      await expect(saveEmailConfiguration(config)).rejects.toThrow();
    });
  });

  describe('fetchAllMemos', () => {
    it('should fetch all memos', async () => {
      const mockMemos = [
        {
          id: 1,
          title: 'Memo 1',
          content: '',
          createTime: Date.now(),
          syncStatus: 1,
        },
      ];

      (storage.getAllMemos as any).mockResolvedValue(mockMemos);

      const memos = await fetchAllMemos();

      expect(memos).toEqual(mockMemos);
      expect(storage.getAllMemos).toHaveBeenCalled();
    });
  });

  describe('fetchMemoById', () => {
    it('should fetch memo by id', async () => {
      const mockMemo = {
        id: 1,
        title: 'Memo 1',
        content: 'Content',
        createTime: Date.now(),
        syncStatus: 1,
      };

      (storage.getMemoById as any).mockResolvedValue(mockMemo);

      const memo = await fetchMemoById(1);

      expect(memo).toEqual(mockMemo);
      expect(storage.getMemoById).toHaveBeenCalledWith(1);
    });
  });
});
