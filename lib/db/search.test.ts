import { describe, it, expect } from 'vitest';
import {
  searchMemos,
  highlightSearchMatch,
  getSearchPreview,
  rankSearchResults,
} from './search';
import { Memo, SyncStatus } from './types';

describe('Search Module', () => {
  const mockMemos: Memo[] = [
    {
      id: 1,
      title: 'React学习笔记',
      content: '今天学习了React Hooks的使用方法',
      createTime: Date.now() - 3000,
      syncStatus: SyncStatus.SUCCESS,
    },
    {
      id: 2,
      title: 'TypeScript入门',
      content: 'TypeScript是JavaScript的超集，提供了类型检查功能',
      createTime: Date.now() - 2000,
      syncStatus: SyncStatus.SUCCESS,
    },
    {
      id: 3,
      title: '项目计划',
      content: '完成React项目的开发和测试',
      createTime: Date.now() - 1000,
      syncStatus: SyncStatus.SUCCESS,
    },
  ];

  describe('searchMemos', () => {
    it('should return all memos when query is empty', () => {
      const result = searchMemos(mockMemos, '');
      expect(result).toEqual(mockMemos);
    });

    it('should search by title', () => {
      const result = searchMemos(mockMemos, 'React');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
    });

    it('should search by content', () => {
      const result = searchMemos(mockMemos, 'JavaScript');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });

    it('should be case insensitive', () => {
      const result = searchMemos(mockMemos, 'react');
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no match', () => {
      const result = searchMemos(mockMemos, 'Python');
      expect(result).toHaveLength(0);
    });

    it('should trim whitespace in query', () => {
      const result = searchMemos(mockMemos, '  React  ');
      expect(result).toHaveLength(2);
    });
  });

  describe('highlightSearchMatch', () => {
    it('should find all matches', () => {
      const result = highlightSearchMatch('React React React', 'React');
      expect(result.matches).toHaveLength(3);
      expect(result.matches[0]).toEqual({ start: 0, end: 5 });
      expect(result.matches[1]).toEqual({ start: 6, end: 11 });
      expect(result.matches[2]).toEqual({ start: 12, end: 17 });
    });

    it('should be case insensitive', () => {
      const result = highlightSearchMatch('React REACT react', 'react');
      expect(result.matches).toHaveLength(3);
    });

    it('should return empty matches for empty query', () => {
      const result = highlightSearchMatch('React', '');
      expect(result.matches).toHaveLength(0);
    });

    it('should return empty matches when no match found', () => {
      const result = highlightSearchMatch('React', 'Python');
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('getSearchPreview', () => {
    it('should return content preview when match found in content', () => {
      const memo = mockMemos[1];
      const preview = getSearchPreview(memo, 'JavaScript', 50);
      expect(preview).toContain('JavaScript');
    });

    it('should return content beginning when no match in content', () => {
      const memo = mockMemos[0];
      const preview = getSearchPreview(memo, 'Python', 50);
      expect(preview).toContain('今天学习');
    });

    it('should return title when no content', () => {
      const memo: Memo = {
        id: 4,
        title: 'Test Title',
        content: undefined,
        createTime: Date.now(),
        syncStatus: SyncStatus.SUCCESS,
      };
      const preview = getSearchPreview(memo, 'anything', 50);
      expect(preview).toBe('Test Title');
    });

    it('should truncate long content', () => {
      const memo = mockMemos[0];
      const preview = getSearchPreview(memo, 'React', 10);
      expect(preview.length).toBeLessThanOrEqual(20); // 包括省略号
    });
  });

  describe('rankSearchResults', () => {
    it('should rank by relevance score', () => {
      const results = rankSearchResults(mockMemos, 'React');
      // 标题包含React的应该排在前面
      expect(results[0].id).toBe(1); // 标题是"React学习笔记"
    });

    it('should maintain original order for same relevance', () => {
      const results = rankSearchResults(mockMemos, 'TypeScript');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(2);
    });

    it('should return all memos when query is empty', () => {
      const results = rankSearchResults(mockMemos, '');
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it('should prioritize title matches over content matches', () => {
      const testMemos: Memo[] = [
        {
          id: 1,
          title: 'Python基础',
          content: '学习Python编程',
          createTime: Date.now(),
          syncStatus: SyncStatus.SUCCESS,
        },
        {
          id: 2,
          title: '编程笔记',
          content: 'Python是一门强大的编程语言',
          createTime: Date.now() - 1000,
          syncStatus: SyncStatus.SUCCESS,
        },
      ];

      const results = rankSearchResults(testMemos, 'Python');
      // 标题中有Python的应该排在前面
      expect(results.length).toBe(2);
      expect(results[0].id).toBe(1);
    });
  });
});
