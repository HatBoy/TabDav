/**
 * 类型定义测试
 */

import { describe, it, expect } from 'vitest';
import type {
  TabItem,
  CreateTabInput,
  UpdateTabInput,
  TabSearchFilters,
  Group,
  CreateGroupInput,
  UpdateGroupInput
} from '../src/common/types';

describe('types', () => {
  describe('TabItem', () => {
    it('should have all required properties', () => {
      const tab: TabItem = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Page',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending'
      };
      expect(tab.id).toBe('test-id');
      expect(tab.url).toBe('https://example.com');
      expect(tab.syncStatus).toBe('pending');
    });

    it('should allow optional properties', () => {
      const tab: TabItem = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Page',
        favicon: 'data:image/png;base64,xxx',
        groupId: 'group-1',
        note: 'My note',
        tags: ['tag1', 'tag2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'synced',
        syncError: undefined
      };
      expect(tab.favicon).toBeDefined();
      expect(tab.groupId).toBe('group-1');
      expect(tab.tags).toHaveLength(2);
    });
  });

  describe('CreateTabInput', () => {
    it('should require url and title', () => {
      const input: CreateTabInput = {
        url: 'https://example.com',
        title: 'Test Page'
      };
      expect(input.url).toBe('https://example.com');
      expect(input.title).toBe('Test Page');
    });
  });

  describe('UpdateTabInput', () => {
    it('should require id', () => {
      const input: UpdateTabInput = {
        id: 'test-id'
      };
      expect(input.id).toBe('test-id');
    });

    it('should allow partial updates', () => {
      const input: UpdateTabInput = {
        id: 'test-id',
        title: 'Updated Title'
      };
      expect(input.title).toBe('Updated Title');
    });
  });

  describe('TabSearchFilters', () => {
    it('should allow all filter options', () => {
      const filters: TabSearchFilters = {
        query: 'test',
        groupId: 'group-1',
        tags: ['tag1'],
        syncStatus: 'pending',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      expect(filters.query).toBe('test');
      expect(filters.sortBy).toBe('createdAt');
    });
  });

  describe('Group', () => {
    it('should have all required properties', () => {
      const group: Group = {
        id: 'group-1',
        name: 'Test Group',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tabCount: 0
      };
      expect(group.id).toBe('group-1');
      expect(group.name).toBe('Test Group');
      expect(group.tabCount).toBe(0);
    });

    it('should allow optional color', () => {
      const group: Group = {
        id: 'group-1',
        name: 'Test Group',
        color: '#FF0000',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tabCount: 5
      };
      expect(group.color).toBe('#FF0000');
      expect(group.tabCount).toBe(5);
    });
  });

  describe('CreateGroupInput', () => {
    it('should require name', () => {
      const input: CreateGroupInput = {
        name: 'New Group'
      };
      expect(input.name).toBe('New Group');
    });

    it('should allow optional color', () => {
      const input: CreateGroupInput = {
        name: 'New Group',
        color: '#00FF00'
      };
      expect(input.color).toBe('#00FF00');
    });
  });

  describe('UpdateGroupInput', () => {
    it('should require id', () => {
      const input: UpdateGroupInput = {
        id: 'group-1'
      };
      expect(input.id).toBe('group-1');
    });

    it('should allow partial updates', () => {
      const input: UpdateGroupInput = {
        id: 'group-1',
        name: 'Updated Name',
        color: '#0000FF'
      };
      expect(input.name).toBe('Updated Name');
      expect(input.color).toBe('#0000FF');
    });
  });
});
