import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateEmailConfig,
  formatMemoToEmail,
  parseEmailToMemo,
} from './service';
import { Memo, SyncStatus } from '../db/types';

describe('Email Service Module', () => {
  describe('validateEmailConfig', () => {
    it('should validate correct email config', () => {
      const config = {
        recipientEmail: 'user@example.com',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      expect(validateEmailConfig(config)).toBe(true);
    });

    it('should reject invalid email format', () => {
      const config = {
        recipientEmail: 'invalid-email',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      expect(validateEmailConfig(config)).toBe(false);
    });

    it('should reject invalid port number', () => {
      const config = {
        recipientEmail: 'user@example.com',
        senderEmail: 'sender@example.com',
        authCode: 'auth123',
        smtpServer: 'smtp.example.com',
        smtpPort: 99999,
      };

      expect(validateEmailConfig(config)).toBe(false);
    });

    it('should reject missing required fields', () => {
      const config = {
        recipientEmail: 'user@example.com',
        senderEmail: 'sender@example.com',
        authCode: '',
        smtpServer: 'smtp.example.com',
        smtpPort: 465,
      };

      expect(validateEmailConfig(config)).toBe(false);
    });

    it('should reject null config', () => {
      expect(validateEmailConfig(null)).toBe(false);
    });
  });

  describe('formatMemoToEmail', () => {
    it('should format memo with content to email', () => {
      const memo: Memo = {
        id: 1,
        title: 'Test Title',
        content: 'Test Content',
        createTime: Date.now(),
        syncStatus: SyncStatus.PENDING,
      };

      const email = formatMemoToEmail(memo);

      expect(email.subject).toBe('Test Title');
      expect(email.body).toBe('Test Content');
    });

    it('should use title as body when content is empty', () => {
      const memo: Memo = {
        id: 1,
        title: 'Test Title',
        content: undefined,
        createTime: Date.now(),
        syncStatus: SyncStatus.PENDING,
      };

      const email = formatMemoToEmail(memo);

      expect(email.subject).toBe('Test Title');
      expect(email.body).toBe('Test Title');
    });

    it('should preserve multiline content', () => {
      const memo: Memo = {
        id: 1,
        title: 'Title',
        content: 'Line 1\nLine 2\nLine 3',
        createTime: Date.now(),
        syncStatus: SyncStatus.PENDING,
      };

      const email = formatMemoToEmail(memo);

      expect(email.body).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('parseEmailToMemo', () => {
    it('should parse email with subject and body', () => {
      const subject = 'Test Subject';
      const body = 'Test Body';
      const date = new Date('2026-04-05');
      const messageId = 'msg-123';

      const memo = parseEmailToMemo(subject, body, date, messageId);

      expect(memo.title).toBe('Test Subject');
      expect(memo.content).toBe('Test Body');
      expect(memo.createTime).toBe(date.getTime());
      expect(memo.emailMessageId).toBe('msg-123');
      expect(memo.syncStatus).toBe(SyncStatus.SUCCESS);
    });

    it('should set content to undefined when body equals subject', () => {
      const subject = 'Test Subject';
      const body = 'Test Subject';
      const date = new Date();
      const messageId = 'msg-123';

      const memo = parseEmailToMemo(subject, body, date, messageId);

      expect(memo.title).toBe('Test Subject');
      expect(memo.content).toBeUndefined();
    });

    it('should preserve multiline body', () => {
      const subject = 'Title';
      const body = 'Line 1\nLine 2\nLine 3';
      const date = new Date();
      const messageId = 'msg-123';

      const memo = parseEmailToMemo(subject, body, date, messageId);

      expect(memo.content).toBe('Line 1\nLine 2\nLine 3');
    });
  });
});
