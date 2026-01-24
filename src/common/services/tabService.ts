/**
 * Tab数据访问服务
 */

import { getDB } from '../utils/storage';
import type {
  TabItem,
  CreateTabInput,
  UpdateTabInput,
  TabSearchFilters,
  TabStats,
} from '../types/tab';
import { generateId } from '../utils/crypto';

/**
 * Tab数据访问层
 */
class TabService {
  /**
   * 检查URL是否已存在
   */
  async existsByUrl(url: string): Promise<boolean> {
    const db = await getDB();
    const index = db.transaction('tabs', 'readonly').store.index('by-url');
    const existing = await index.get(url);
    return !!existing;
  }

  /**
   * 根据URL获取Tab
   */
  async getByUrl(url: string): Promise<TabItem | null> {
    const db = await getDB();
    const index = db.transaction('tabs', 'readonly').store.index('by-url');
    return (await index.get(url)) ?? null;
  }

  /**
   * 添加Tab（自动去重）
   * @returns { tab: TabItem, isDuplicate: boolean }
   */
  async add(input: CreateTabInput): Promise<{ tab: TabItem; isDuplicate: boolean }> {
    const db = await getDB();
    const now = Date.now();

    // 检查是否已存在相同URL的Tab
    const existing = await this.getByUrl(input.url);
    if (existing) {
      // Tab已存在，直接返回（视为重复）
      return { tab: existing, isDuplicate: true };
    }

    const tab: TabItem = {
      id: generateId(),
      url: input.url,
      title: input.title,
      favicon: input.favicon,
      groupId: input.groupId,
      note: input.note,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
    };

    await db.put('tabs', tab);
    return { tab, isDuplicate: false };
  }

  /**
   * 批量添加Tab
   */
  async bulkAdd(inputs: CreateTabInput[]): Promise<TabItem[]> {
    const db = await getDB();
    const now = Date.now();
    const tabs: TabItem[] = [];
    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    for (const input of inputs) {
      const tab: TabItem = {
        id: generateId(),
        url: input.url,
        title: input.title,
        favicon: input.favicon,
        groupId: input.groupId,
        note: input.note,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };
      store.put(tab);
      tabs.push(tab);
    }

    await tx.done;
    return tabs;
  }

  /**
   * 更新Tab
   */
  async update(input: UpdateTabInput): Promise<TabItem | null> {
    const db = await getDB();
    const existing = await db.get('tabs', input.id);

    if (!existing) {
      return null;
    }

    // 特殊处理 groupId：undefined 表示不更新，空字符串表示移出分组
    const newGroupId = input.groupId;
    const shouldUpdateGroupId = newGroupId !== undefined;
    const finalGroupId = shouldUpdateGroupId ? newGroupId : existing.groupId;

    const updated: TabItem = {
      ...existing,
      title: input.title ?? existing.title,
      favicon: input.favicon ?? existing.favicon,
      groupId: finalGroupId,
      note: input.note ?? existing.note,
      tags: input.tags !== undefined ? input.tags : existing.tags,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    };

    await db.put('tabs', updated);

    return updated;
  }

  /**
   * 删除Tab
   */
  async delete(id: string): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('tabs', id);

    if (!existing) {
      return false;
    }

    await db.delete('tabs', id);
    return true;
  }

  /**
   * 根据ID获取Tab
   */
  async getById(id: string): Promise<TabItem | null> {
    const db = await getDB();
    return (await db.get('tabs', id)) ?? null;
  }

  /**
   * 获取所有Tab
   */
  async getAll(): Promise<TabItem[]> {
    const db = await getDB();
    const tabs = await db.getAll('tabs');
    return tabs;
  }

  /**
   * 批量删除Tab
   */
  async bulkDelete(ids: string[]): Promise<number> {
    const db = await getDB();
    let deletedCount = 0;
    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    for (const id of ids) {
      await store.delete(id);
      deletedCount++;
    }

    await tx.done;
    return deletedCount;
  }

  /**
   * 批量获取指定的Tab（用于同步导入）
   */
  async getByIds(ids: string[]): Promise<TabItem[]> {
    if (ids.length === 0) return [];
    const db = await getDB();
    const tabs: TabItem[] = [];
    for (const id of ids) {
      const tab = await db.get('tabs', id);
      if (tab) tabs.push(tab);
    }
    return tabs;
  }

  /**
   * 根据分组ID获取Tab
   */
  async getByGroup(groupId: string): Promise<TabItem[]> {
    const db = await getDB();
    // 先尝试使用索引查询
    let tabs = await db.getAllFromIndex('tabs', 'by-group', groupId);

    // 额外验证：如果 groupId 是有效字符串，确保结果中的 tab.groupId 确实匹配
    if (groupId && groupId !== '') {
      tabs = tabs.filter(t => t.groupId === groupId);
    }

    // 调试日志

    return tabs;
  }

  /**
   * 获取未分类的Tab
   */
  async getUncategorized(): Promise<TabItem[]> {
    const db = await getDB();
    const allTabs = await db.getAll('tabs');
    return allTabs.filter(tab => !tab.groupId);
  }

  /**
   * 搜索Tab
   * 使用索引优化查询，关键词搜索仍需在内存中过滤
   */
  async search(filters: TabSearchFilters): Promise<TabItem[]> {
    const db = await getDB();

    // 优先使用索引查询，减少数据加载量
    if (filters.groupId && !filters.query && !filters.tags && !filters.syncStatus) {
      // 只需要按分组筛选时，使用索引
      return db.getAllFromIndex('tabs', 'by-group', filters.groupId);
    }

    if (filters.syncStatus && !filters.query && !filters.tags && !filters.groupId) {
      // 只需要按同步状态筛选时，使用索引
      return db.getAllFromIndex('tabs', 'by-sync-status', filters.syncStatus);
    }

    // 复杂查询：先尝试使用索引缩小范围，再在内存中过滤
    let tabs: TabItem[];

    if (filters.groupId) {
      tabs = await db.getAllFromIndex('tabs', 'by-group', filters.groupId);
    } else if (filters.syncStatus) {
      tabs = await db.getAllFromIndex('tabs', 'by-sync-status', filters.syncStatus);
    } else {
      tabs = await db.getAll('tabs');
    }

    // 按标签筛选（内存过滤）
    if (filters.tags && filters.tags.length > 0) {
      tabs = tabs.filter(tab => filters.tags!.some(tag => tab.tags?.includes(tag)));
    }

    // 按关键词搜索（内存过滤）
    if (filters.query) {
      const query = filters.query.toLowerCase();
      tabs = tabs.filter(
        tab => tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
      );
    }

    // 排序
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    tabs.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'lastVisited':
          comparison = (a.lastVisited || 0) - (b.lastVisited || 0);
          break;
        case 'createdAt':
        default:
          comparison = a.createdAt - b.createdAt;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return tabs;
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<TabStats> {
    const db = await getDB();
    const tabs = await db.getAll('tabs');

    const stats: TabStats = {
      total: tabs.length,
      synced: 0,
      pending: 0,
      error: 0,
      byGroup: {},
    };

    for (const tab of tabs) {
      // 同步状态统计
      if (tab.syncStatus === 'synced') {
        stats.synced++;
      } else if (tab.syncStatus === 'pending') {
        stats.pending++;
      } else if (tab.syncStatus === 'error') {
        stats.error++;
      }

      // 分组统计
      const groupId = tab.groupId || 'uncategorized';
      stats.byGroup[groupId] = (stats.byGroup[groupId] || 0) + 1;
    }

    return stats;
  }

  /**
   * 更新同步状态
   */
  async updateSyncStatus(
    id: string,
    status: 'synced' | 'pending' | 'error',
    error?: string
  ): Promise<boolean> {
    const db = await getDB();
    const tab = await db.get('tabs', id);

    if (!tab) {
      return false;
    }

    tab.syncStatus = status;
    tab.syncError = error;
    await db.put('tabs', tab);
    return true;
  }

  /**
   * 批量更新同步状态
   * 使用IDBKeyRange优化查询
   */
  async bulkUpdateSyncStatus(
    ids: string[],
    status: 'synced' | 'pending' | 'error'
  ): Promise<number> {
    const db = await getDB();
    let updated = 0;

    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    // 使用IDBKeyRange优化查询
    for (const id of ids) {
      const tab = await store.get(id);
      if (tab) {
        tab.syncStatus = status;
        store.put(tab);
        updated++;
      }
    }

    await tx.done;
    return updated;
  }

  /**
   * 将所有Tab标记为已同步
   * 使用游标批量更新，避免加载所有数据到内存
   */
  async markAllSynced(): Promise<number> {
    const db = await getDB();
    let updated = 0;

    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    // 使用只返回key的索引进行高效游标遍历
    const index = store.index('by-sync-status-keys');
    const range = IDBKeyRange.only('pending');

    let cursor = await index.openKeyCursor(range);

    while (cursor) {
      const tab = await store.get(cursor.primaryKey);
      if (tab) {
        tab.syncStatus = 'synced';
        store.put(tab);
        updated++;
      }
      cursor = await cursor.continue();
    }

    await tx.done;
    return updated;
  }

  /**
   * 获取待同步的Tab
   */
  async getPending(): Promise<TabItem[]> {
    const db = await getDB();
    const tabs = await db.getAll('tabs');
    return tabs.filter(tab => tab.syncStatus === 'pending');
  }

  /**
   * 清除已删除Tab的历史记录（保留一定数量）
   */
  async cleanup(maxKeep: number = 1000): Promise<void> {
    const db = await getDB();
    const tabs = await db.getAll('tabs');

    // 按更新时间排序，保留最新的
    tabs.sort((a, b) => b.updatedAt - a.updatedAt);

    if (tabs.length > maxKeep) {
      const toDelete = tabs.slice(maxKeep);
      const tx = db.transaction('tabs', 'readwrite');
      const store = tx.objectStore('tabs');

      for (const tab of toDelete) {
        await store.delete(tab.id);
      }

      await tx.done;
    }
  }
}

// 导出单例
export const tabService = new TabService();
