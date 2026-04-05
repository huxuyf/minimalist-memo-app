/**
 * 数据仓库层
 * 负责数据的增删改查和业务逻辑
 */

import {
  getAllMemos,
  getMemoById,
  createMemo,
  updateMemo,
  deleteMemo,
  updateMemoSyncStatus,
  getPendingMemos,
  importMemos,
  clearAllMemos,
  getEmailConfig,
  saveEmailConfig,
  deleteEmailConfig,
} from './storage';
import { Memo, SyncStatus, EmailConfig } from './types';
import {
  sendEmail,
  testEmailConfig,
  fetchEmailsFromMailbox,
  validateEmailConfig,
} from '../email/service';

/**
 * 创建新备忘录并同步
 */
export async function createAndSyncMemo(
  title: string,
  content?: string
): Promise<{ memo: Memo; syncSuccess: boolean; syncError?: string }> {
  try {
    // 1. 本地保存
    const memo = await createMemo(title, content);
    
    // 2. 尝试同步到邮箱
    const config = await getEmailConfig();
    let syncSuccess = false;
    let syncError: string | undefined;
    
    if (config && validateEmailConfig(config)) {
      const result = await sendEmail(config, memo);
      if (result.success) {
        syncSuccess = true;
        // 更新邮件ID和同步状态
        await updateMemoSyncStatus(memo.id, SyncStatus.SUCCESS, result.messageId);
      } else {
        syncError = result.error;
        // 标记为待同步
        await updateMemoSyncStatus(memo.id, SyncStatus.PENDING);
      }
    } else {
      // 没有配置邮箱，标记为待同步
      await updateMemoSyncStatus(memo.id, SyncStatus.PENDING);
    }
    
    return { memo, syncSuccess, syncError };
  } catch (error) {
    console.error('Failed to create and sync memo:', error);
    throw error;
  }
}

/**
 * 更新备忘录并重新同步
 */
export async function updateAndSyncMemo(
  id: number,
  title: string,
  content?: string
): Promise<{ memo: Memo | null; syncSuccess: boolean; syncError?: string }> {
  try {
    // 1. 本地更新
    const memo = await updateMemo(id, title, content);
    if (!memo) return { memo: null, syncSuccess: false };
    
    // 2. 尝试重新同步到邮箱
    const config = await getEmailConfig();
    let syncSuccess = false;
    let syncError: string | undefined;
    
    if (config && validateEmailConfig(config)) {
      const result = await sendEmail(config, memo);
      if (result.success) {
        syncSuccess = true;
        await updateMemoSyncStatus(memo.id, SyncStatus.SUCCESS, result.messageId);
      } else {
        syncError = result.error;
        await updateMemoSyncStatus(memo.id, SyncStatus.FAILED);
      }
    } else {
      await updateMemoSyncStatus(memo.id, SyncStatus.PENDING);
    }
    
    return { memo, syncSuccess, syncError };
  } catch (error) {
    console.error('Failed to update and sync memo:', error);
    throw error;
  }
}

/**
 * 删除备忘录
 */
export async function deleteMemoRecord(id: number): Promise<boolean> {
  try {
    return await deleteMemo(id);
  } catch (error) {
    console.error('Failed to delete memo:', error);
    throw error;
  }
}

/**
 * 重试待同步的备忘录
 */
export async function retrySyncPendingMemos(): Promise<void> {
  try {
    const pendingMemos = await getPendingMemos();
    const config = await getEmailConfig();
    
    if (!config || !validateEmailConfig(config)) {
      console.log('Email config not available, skipping sync');
      return;
    }
    
    for (const memo of pendingMemos) {
      const result = await sendEmail(config, memo);
      if (result.success) {
        await updateMemoSyncStatus(memo.id, SyncStatus.SUCCESS, result.messageId);
      } else {
        console.error(`Failed to sync memo ${memo.id}:`, result.error);
      }
    }
  } catch (error) {
    console.error('Failed to retry sync:', error);
  }
}

/**
 * 保存邮箱配置
 */
export async function saveEmailConfiguration(config: EmailConfig): Promise<void> {
  try {
    if (!validateEmailConfig(config)) {
      throw new Error('邮箱配置无效');
    }
    await saveEmailConfig(config);
  } catch (error) {
    console.error('Failed to save email config:', error);
    throw error;
  }
}

/**
 * 获取邮箱配置
 */
export async function getEmailConfiguration(): Promise<EmailConfig | null> {
  try {
    return await getEmailConfig();
  } catch (error) {
    console.error('Failed to get email config:', error);
    return null;
  }
}

/**
 * 测试邮箱配置
 */
export async function testEmailConfiguration(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
  try {
    return await testEmailConfig(config);
  } catch (error) {
    console.error('Failed to test email config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '测试失败',
    };
  }
}

/**
 * 一键恢复：从邮箱拉取所有邮件并导入本地
 */
export async function recoverFromMailbox(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const config = await getEmailConfig();
    if (!config || !validateEmailConfig(config)) {
      return { success: false, count: 0, error: '邮箱配置无效' };
    }
    
    const result = await fetchEmailsFromMailbox(config);
    if (!result.success || !result.memos) {
      return { success: false, count: 0, error: result.error };
    }
    
    // 导入邮件到本地数据库
    await importMemos(result.memos);
    
    return { success: true, count: result.memos.length };
  } catch (error) {
    console.error('Failed to recover from mailbox:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : '恢复失败',
    };
  }
}

/**
 * 获取所有备忘录
 */
export async function fetchAllMemos(): Promise<Memo[]> {
  try {
    return await getAllMemos();
  } catch (error) {
    console.error('Failed to fetch memos:', error);
    return [];
  }
}

/**
 * 获取单个备忘录
 */
export async function fetchMemoById(id: number): Promise<Memo | null> {
  try {
    return await getMemoById(id);
  } catch (error) {
    console.error('Failed to fetch memo:', error);
    return null;
  }
}

/**
 * 清空所有数据（用于测试或重置）
 */
export async function clearAllData(): Promise<void> {
  try {
    await clearAllMemos();
    await deleteEmailConfig();
  } catch (error) {
    console.error('Failed to clear all data:', error);
    throw error;
  }
}
