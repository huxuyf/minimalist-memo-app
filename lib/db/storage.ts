/**
 * 本地数据库存储层
 * 使用AsyncStorage存储备忘录数据
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Memo, SyncStatus } from './types';

export { SyncStatus } from './types';

const MEMOS_KEY = 'memos';
const CONFIG_KEY = 'email_config';

/**
 * 获取所有备忘录（按创建时间倒序）
 */
export async function getAllMemos(): Promise<Memo[]> {
  try {
    const data = await AsyncStorage.getItem(MEMOS_KEY);
    if (!data) return [];
    const memos = JSON.parse(data) as Memo[];
    return memos.sort((a, b) => b.createTime - a.createTime);
  } catch (error) {
    console.error('Failed to get memos:', error);
    return [];
  }
}

/**
 * 获取单个备忘录
 */
export async function getMemoById(id: number): Promise<Memo | null> {
  try {
    const memos = await getAllMemos();
    return memos.find(m => m.id === id) || null;
  } catch (error) {
    console.error('Failed to get memo:', error);
    return null;
  }
}

/**
 * 创建新备忘录
 */
export async function createMemo(title: string, content?: string): Promise<Memo> {
  try {
    const memos = await getAllMemos();
    const newId = memos.length > 0 ? Math.max(...memos.map(m => m.id)) + 1 : 1;
    
    const newMemo: Memo = {
      id: newId,
      title,
      content,
      createTime: Date.now(),
      syncStatus: SyncStatus.PENDING,
    };
    
    const allMemos = [...memos, newMemo];
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(allMemos));
    return newMemo;
  } catch (error) {
    console.error('Failed to create memo:', error);
    throw error;
  }
}

/**
 * 更新备忘录
 */
export async function updateMemo(
  id: number,
  title: string,
  content?: string
): Promise<Memo | null> {
  try {
    const memos = await getAllMemos();
    const index = memos.findIndex(m => m.id === id);
    
    if (index === -1) return null;
    
    const updatedMemo: Memo = {
      ...memos[index],
      title,
      content,
      syncStatus: SyncStatus.PENDING, // 更新后标记为待同步
    };
    
    memos[index] = updatedMemo;
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
    return updatedMemo;
  } catch (error) {
    console.error('Failed to update memo:', error);
    throw error;
  }
}

/**
 * 删除备忘录
 */
export async function deleteMemo(id: number): Promise<boolean> {
  try {
    const memos = await getAllMemos();
    const filteredMemos = memos.filter(m => m.id !== id);
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(filteredMemos));
    return true;
  } catch (error) {
    console.error('Failed to delete memo:', error);
    throw error;
  }
}

/**
 * 更新备忘录同步状态
 */
export async function updateMemoSyncStatus(
  id: number,
  syncStatus: SyncStatus,
  emailMessageId?: string
): Promise<Memo | null> {
  try {
    const memos = await getAllMemos();
    const index = memos.findIndex(m => m.id === id);
    
    if (index === -1) return null;
    
    const updatedMemo: Memo = {
      ...memos[index],
      syncStatus,
      emailMessageId: emailMessageId || memos[index].emailMessageId,
    };
    
    memos[index] = updatedMemo;
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
    return updatedMemo;
  } catch (error) {
    console.error('Failed to update sync status:', error);
    throw error;
  }
}

/**
 * 获取待同步的备忘录
 */
export async function getPendingMemos(): Promise<Memo[]> {
  try {
    const memos = await getAllMemos();
    return memos.filter(m => m.syncStatus === SyncStatus.PENDING);
  } catch (error) {
    console.error('Failed to get pending memos:', error);
    return [];
  }
}

/**
 * 批量导入备忘录（用于数据恢复）
 */
export async function importMemos(newMemos: Memo[]): Promise<void> {
  try {
    const existingMemos = await getAllMemos();
    
    // 合并新旧数据，避免重复（按emailMessageId）
    const memoMap = new Map<string, Memo>();
    
    existingMemos.forEach(m => {
      if (m.emailMessageId) {
        memoMap.set(m.emailMessageId, m);
      }
    });
    
    newMemos.forEach(m => {
      if (m.emailMessageId && !memoMap.has(m.emailMessageId)) {
        memoMap.set(m.emailMessageId, m);
      }
    });
    
    const mergedMemos = Array.from(memoMap.values());
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(mergedMemos));
  } catch (error) {
    console.error('Failed to import memos:', error);
    throw error;
  }
}

/**
 * 清空所有备忘录
 */
export async function clearAllMemos(): Promise<void> {
  try {
    await AsyncStorage.removeItem(MEMOS_KEY);
  } catch (error) {
    console.error('Failed to clear memos:', error);
    throw error;
  }
}

/**
 * 获取邮箱配置
 */
export async function getEmailConfig() {
  try {
    const data = await AsyncStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get email config:', error);
    return null;
  }
}

/**
 * 保存邮箱配置
 */
export async function saveEmailConfig(config: any): Promise<void> {
  try {
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save email config:', error);
    throw error;
  }
}

/**
 * 删除邮箱配置
 */
export async function deleteEmailConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CONFIG_KEY);
  } catch (error) {
    console.error('Failed to delete email config:', error);
    throw error;
  }
}
