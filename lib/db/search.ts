/**
 * 搜索功能模块
 * 支持按标题和内容搜索备忘录
 */

import { Memo } from './types';

/**
 * 搜索备忘录
 * @param memos - 所有备忘录列表
 * @param query - 搜索关键词
 * @returns 搜索结果列表
 */
export function searchMemos(memos: Memo[], query: string): Memo[] {
  if (!query || query.trim().length === 0) {
    return memos;
  }

  const lowerQuery = query.toLowerCase().trim();

  return memos.filter((memo) => {
    const titleMatch = memo.title.toLowerCase().includes(lowerQuery);
    const contentMatch = memo.content && memo.content.toLowerCase().includes(lowerQuery);
    return titleMatch || contentMatch;
  });
}

/**
 * 高亮搜索结果中的匹配文本
 * @param text - 原始文本
 * @param query - 搜索关键词
 * @returns 带有匹配位置信息的结果
 */
export function highlightSearchMatch(text: string, query: string): { text: string; matches: Array<{ start: number; end: number }> } {
  const matches: Array<{ start: number; end: number }> = [];
  
  if (!query || query.trim().length === 0) {
    return { text, matches };
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();
  let startIndex = 0;

  while (true) {
    const index = lowerText.indexOf(lowerQuery, startIndex);
    if (index === -1) break;
    
    matches.push({
      start: index,
      end: index + lowerQuery.length,
    });
    
    startIndex = index + lowerQuery.length;
  }

  return { text, matches };
}

/**
 * 获取搜索结果的预览文本
 * @param memo - 备忘录
 * @param query - 搜索关键词
 * @param maxLength - 最大长度
 * @returns 预览文本
 */
export function getSearchPreview(memo: Memo, query: string, maxLength: number = 100): string {
  const lowerQuery = query.toLowerCase().trim();
  
  // 优先在内容中查找
  if (memo.content) {
    const lowerContent = memo.content.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);
    
    if (index !== -1) {
      // 返回匹配位置周围的文本
      const start = Math.max(0, index - 20);
      const end = Math.min(memo.content.length, start + maxLength);
      const preview = memo.content.substring(start, end).trim();
      
      return (start > 0 ? '...' : '') + preview + (end < memo.content.length ? '...' : '');
    }
  }
  
  // 如果内容中没有找到，返回内容的开头或标题
  if (memo.content) {
    const preview = memo.content.substring(0, maxLength).trim();
    return preview + (memo.content.length > maxLength ? '...' : '');
  }
  
  return memo.title;
}

/**
 * 按相关性排序搜索结果
 * @param memos - 搜索结果列表
 * @param query - 搜索关键词
 * @returns 排序后的结果
 */
export function rankSearchResults(memos: Memo[], query: string): Memo[] {
  if (!query || query.trim().length === 0) {
    return memos;
  }

  const lowerQuery = query.toLowerCase().trim();

  return [...memos].sort((a, b) => {
    // 计算每个备忘录的相关性分数
    const scoreA = calculateRelevanceScore(a, lowerQuery);
    const scoreB = calculateRelevanceScore(b, lowerQuery);
    
    // 分数高的排在前面
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // 分数相同时，按时间倒序排列
    return b.createTime - a.createTime;
  });
}

/**
 * 计算备忘录与搜索关键词的相关性分数
 * @param memo - 备忘录
 * @param query - 搜索关键词
 * @returns 相关性分数
 */
function calculateRelevanceScore(memo: Memo, query: string): number {
  let score = 0;
  
  const titleLower = memo.title.toLowerCase();
  const contentLower = memo.content?.toLowerCase() || '';
  
  // 标题完全匹配得分最高
  if (titleLower === query) {
    score += 100;
  }
  // 标题开头匹配
  else if (titleLower.startsWith(query)) {
    score += 50;
  }
  // 标题包含
  else if (titleLower.includes(query)) {
    score += 30;
  }
  
  // 内容完全匹配
  if (contentLower === query) {
    score += 50;
  }
  // 内容开头匹配
  else if (contentLower.startsWith(query)) {
    score += 25;
  }
  // 内容包含
  else if (contentLower.includes(query)) {
    score += 10;
  }
  
  // 计算匹配次数
  const titleMatches = (titleLower.match(new RegExp(query, 'g')) || []).length;
  const contentMatches = (contentLower.match(new RegExp(query, 'g')) || []).length;
  
  score += titleMatches * 5 + contentMatches * 2;
  
  return score;
}
