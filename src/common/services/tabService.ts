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
   * 在同一事务中更新分组的tabCount
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

    const tx = db.transaction(['tabs', 'groups'], 'readwrite');
    const tabStore = tx.objectStore('tabs');
    const groupStore = tx.objectStore('groups');
    const index = tabStore.index('by-group');

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
      // 如果添加到Inbox（groupId为空），设置inboxAt时间戳
      inboxAt: input.groupId ? undefined : now,
    };

    await tabStore.put(tab);

    // 如果添加到分组，更新该分组的tabCount
    if (tab.groupId) {
      const group = await groupStore.get(tab.groupId);
      if (group) {
        const allTabs = await index.getAll(tab.groupId);
        const activeTabs = allTabs.filter(t => !t.deletedAt);
        group.tabCount = activeTabs.length;
        group.updatedAt = Date.now();
        await groupStore.put(group);
      }
    }

    await tx.done;
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
        // 如果添加到Inbox（groupId为空），设置inboxAt时间戳
        inboxAt: input.groupId ? undefined : now,
      };
      store.put(tab);
      tabs.push(tab);
    }

    await tx.done;
    return tabs;
  }

  /**
   * 更新Tab
   * 当groupId改变时，在同一事务中更新相关分组的tabCount
   * 同时处理inbox时间追踪
   */
  async update(input: UpdateTabInput): Promise<TabItem | null> {
    const db = await getDB();
    const tx = db.transaction(['tabs', 'groups'], 'readwrite');
    const tabStore = tx.objectStore('tabs');
    const groupStore = tx.objectStore('groups');
    const index = tabStore.index('by-group');

    const existing = await tabStore.get(input.id);
    if (!existing) {
      await tx.done;
      return null;
    }

    // 特殊处理 groupId：undefined 表示不更新，空字符串表示移出分组
    const newGroupId = input.groupId;
    const shouldUpdateGroupId = newGroupId !== undefined;
    const finalGroupId = shouldUpdateGroupId ? (newGroupId || undefined) : existing.groupId;
    const oldGroupId = existing.groupId;

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

    // 处理inbox时间追踪
    if (shouldUpdateGroupId && oldGroupId !== finalGroupId) {
      // 移入inbox：设置inboxAt时间
      if (!finalGroupId) {
        updated.inboxAt = Date.now();
        // 清除风吹标记（用户主动移入inbox，不是风吹来的）
        delete updated.cleanedByWind;
      }
      // 移出inbox：清除inboxAt
      if (finalGroupId && !oldGroupId) {
        delete updated.inboxAt;
        delete updated.cleanedByWind;
      }
      // 从分组A移到分组B：不影响inbox状态（但如果之前在inbox，清除inbox标记）
      if (oldGroupId && finalGroupId) {
        delete updated.inboxAt;
        delete updated.cleanedByWind;
      }
    }

    await tabStore.put(updated);

    // 如果groupId发生了改变，需要更新相关分组的tabCount
    if (shouldUpdateGroupId && oldGroupId !== finalGroupId) {
      // 更新旧分组的tabCount（如果从分组中移出）
      if (oldGroupId) {
        const oldGroup = await groupStore.get(oldGroupId);
        if (oldGroup) {
          const allTabs = await index.getAll(oldGroupId);
          const activeTabs = allTabs.filter(t => !t.deletedAt);
          oldGroup.tabCount = activeTabs.length;
          oldGroup.updatedAt = Date.now();
          await groupStore.put(oldGroup);
        }
      }

      // 更新新分组的tabCount（如果移动到分组）
      if (finalGroupId) {
        const newGroup = await groupStore.get(finalGroupId);
        if (newGroup) {
          const allTabs = await index.getAll(finalGroupId);
          const activeTabs = allTabs.filter(t => !t.deletedAt);
          newGroup.tabCount = activeTabs.length;
          newGroup.updatedAt = Date.now();
          await groupStore.put(newGroup);
        }
      }
    }

    await tx.done;
    return updated;
  }

  /**
   * 删除Tab（归档到History）
   * 实际上不删除数据，而是设置 deletedAt 时间戳
   * 在同一事务中更新分组的tabCount，确保数据一致性
   * @param id - Tab ID
   * @param status - 可选的状态标记：'completed' 表示已完成，'deleted' 表示已删除
   */
  async delete(id: string, status?: 'completed' | 'deleted'): Promise<boolean> {
    const db = await getDB();
    const tx = db.transaction(['tabs', 'groups'], 'readwrite');
    const tabStore = tx.objectStore('tabs');
    const groupStore = tx.objectStore('groups');

    const existing = await tabStore.get(id);
    if (!existing) {
      await tx.done;
      return false;
    }

    // 保存删除前的groupId（用于更新计数）
    const groupId = existing.groupId;

    // 保存删除前的 groupId，以便恢复时使用
    existing.originalGroupId = existing.groupId;
    // 设置删除时间戳，将tab归档到History
    existing.deletedAt = Date.now();
    existing.updatedAt = Date.now();
    existing.syncStatus = 'pending';
    // 设置状态标记（completed 或 deleted）
    if (status) {
      existing.status = status;
    }

    await tabStore.put(existing);

    // 如果tab属于某个分组，在同一个事务中更新该分组的tabCount
    if (groupId) {
      const group = await groupStore.get(groupId);
      if (group) {
        // 使用索引获取该分组的所有未删除tabs
        const index = tabStore.index('by-group');
        const allTabs = await index.getAll(groupId);
        const activeTabs = allTabs.filter(t => !t.deletedAt);
        group.tabCount = activeTabs.length;
        group.updatedAt = Date.now();
        await groupStore.put(group);
      }
    }

    // 等待事务完成确保数据已提交
    await tx.done;
    return true;
  }

  /**
   * 恢复Tab（从History恢复到原来的位置）
   * 清除 deletedAt，并尝试恢复到 originalGroupId
   * 如果原分组不存在，则恢复到 Inbox（groupId = undefined）
   * 在同一事务中更新相关分组的tabCount
   */
  async restore(id: string): Promise<boolean> {
    const db = await getDB();
    const tx = db.transaction(['tabs', 'groups'], 'readwrite');
    const tabStore = tx.objectStore('tabs');
    const groupStore = tx.objectStore('groups');
    const index = tabStore.index('by-group');

    const existing = await tabStore.get(id);
    if (!existing) {
      await tx.done;
      return false;
    }

    // 清除删除标记、风吹标记和状态标记（用户主动恢复，不是风吹来的）
    delete existing.deletedAt;
    delete existing.cleanedByWind;
    delete existing.status;

    // 尝试恢复到原来的分组
    let newGroupId: string | undefined;
    if (existing.originalGroupId) {
      // 检查原分组是否还存在
      const group = await groupStore.get(existing.originalGroupId);
      if (group) {
        // 分组存在，恢复到原分组
        existing.groupId = existing.originalGroupId;
        newGroupId = existing.originalGroupId;
        // 清除inbox时间（不再在inbox中）
        delete existing.inboxAt;
      } else {
        // 分组不存在，恢复到 Inbox
        existing.groupId = undefined;
        // 设置inbox时间（重新开始计时）
        existing.inboxAt = Date.now();
      }
    } else {
      // 没有 originalGroupId，恢复到 Inbox
      existing.groupId = undefined;
      // 设置inbox时间（重新开始计时）
      existing.inboxAt = Date.now();
    }

    existing.updatedAt = Date.now();
    existing.syncStatus = 'pending';

    await tabStore.put(existing);

    // 更新新分组的tabCount（如果恢复到了分组）
    if (newGroupId) {
      const group = await groupStore.get(newGroupId);
      if (group) {
        const allTabs = await index.getAll(newGroupId);
        const activeTabs = allTabs.filter(t => !t.deletedAt);
        group.tabCount = activeTabs.length;
        group.updatedAt = Date.now();
        await groupStore.put(group);
      }
    }

    // 等待事务完成确保数据已提交
    await tx.done;
    return true;
  }

  /**
   * 永久删除Tab（从数据库中真正删除）
   * 使用显式事务确保数据一致性
   */
  async permanentDelete(id: string): Promise<boolean> {
    const db = await getDB();
    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    const existing = await store.get(id);
    if (!existing) {
      await tx.done;
      return false;
    }

    await store.delete(id);
    // 等待事务完成确保数据已提交
    await tx.done;
    return true;
  }

  /**
   * 批量永久删除Tab
   */
  async bulkPermanentDelete(ids: string[]): Promise<number> {
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
   * 批量删除Tab（归档到History）
   * 在同一事务中更新相关分组的tabCount
   */
  async bulkDelete(ids: string[]): Promise<number> {
    const db = await getDB();
    let deletedCount = 0;
    const tx = db.transaction(['tabs', 'groups'], 'readwrite');
    const tabStore = tx.objectStore('tabs');
    const groupStore = tx.objectStore('groups');
    const index = tabStore.index('by-group');

    // 用于收集需要更新计数的分组ID
    const affectedGroupIds = new Set<string>();

    for (const id of ids) {
      const tab = await tabStore.get(id);
      if (tab) {
        // 记录受影响的分组ID
        if (tab.groupId) {
          affectedGroupIds.add(tab.groupId);
        }

        // 保存删除前的 groupId，以便恢复时使用
        tab.originalGroupId = tab.groupId;
        // 设置删除时间戳，将tab归档到History
        tab.deletedAt = Date.now();
        tab.updatedAt = Date.now();
        tab.syncStatus = 'pending';
        await tabStore.put(tab);
        deletedCount++;
      }
    }

    // 更新所有受影响分组的tabCount
    for (const groupId of affectedGroupIds) {
      const group = await groupStore.get(groupId);
      if (group) {
        const allTabs = await index.getAll(groupId);
        const activeTabs = allTabs.filter(t => !t.deletedAt);
        group.tabCount = activeTabs.length;
        group.updatedAt = Date.now();
        await groupStore.put(group);
      }
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
   * 根据分组ID获取Tab（排除已归档到History的Tab）
   */
  async getByGroup(groupId: string): Promise<TabItem[]> {
    const db = await getDB();
    // 先尝试使用索引查询
    let tabs = await db.getAllFromIndex('tabs', 'by-group', groupId);

    // 额外验证：如果 groupId 是有效字符串，确保结果中的 tab.groupId 确实匹配
    if (groupId && groupId !== '') {
      tabs = tabs.filter(t => t.groupId === groupId);
    }

    // 排除已归档到History的Tab
    return tabs.filter(t => !t.deletedAt);
  }

  /**
   * 获取未分类的Tab（排除已归档到History的Tab）
   */
  async getUncategorized(): Promise<TabItem[]> {
    const db = await getDB();
    const allTabs = await db.getAll('tabs');
    return allTabs.filter(tab => !tab.groupId && !tab.deletedAt);
  }

  /**
   * 搜索Tab
   * 使用索引优化查询，关键词搜索仍需在内存中过滤
   * 默认排除已归档到History的Tab（deletedAt）
   */
  async search(filters: TabSearchFilters): Promise<TabItem[]> {
    const db = await getDB();

    // 优先使用索引查询，减少数据加载量
    if (filters.groupId && !filters.query && !filters.tags && !filters.syncStatus) {
      // 只需要按分组筛选时，使用索引，并排除已删除的Tab
      const tabs = await db.getAllFromIndex('tabs', 'by-group', filters.groupId);
      return tabs.filter(t => !t.deletedAt);
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

    // 排除已归档到History的Tab（默认行为）
    if (!filters.includeDeleted) {
      tabs = tabs.filter(tab => !tab.deletedAt);
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
   * 获取统计信息（排除已归档到History的Tab）
   */
  async getStats(): Promise<TabStats> {
    const db = await getDB();
    const tabs = await db.getAll('tabs');

    // 排除已删除的tabs
    const activeTabs = tabs.filter(tab => !tab.deletedAt);

    const stats: TabStats = {
      total: activeTabs.length,
      synced: 0,
      pending: 0,
      error: 0,
      byGroup: {},
    };

    for (const tab of activeTabs) {
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

  /**
   * 清理Inbox中超过7天未处理的Tab
   * 将这些Tab自动移动到History，并标记为"风吹来的"
   * @returns 返回被清理的Tab数量
   */
  async cleanupOldInboxTabs(): Promise<number> {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7天��毫秒数
    const now = Date.now();
    let cleanedCount = 0;

    const db = await getDB();
    const tabs = await db.getAll('tabs');

    // 筛选出需要清理的Inbox tabs
    const tabsToCleanup = tabs.filter(tab => {
      // 在Inbox中且未被删除且未被风吹过
      if (tab.groupId || tab.deletedAt || tab.cleanedByWind) {
        return false;
      }
      // 检查是否超过7天（使用inboxAt或createdAt作为fallback）
      const inboxTime = tab.inboxAt || tab.createdAt;
      return now - inboxTime > SEVEN_DAYS;
    });

    if (tabsToCleanup.length === 0) {
      return 0;
    }

    // 批量更新：将tabs移到History
    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    for (const tab of tabsToCleanup) {
      // 保存原始分组（Inbox没有分组，所以originalGroupId为undefined）
      tab.originalGroupId = undefined;
      // 设置删除时间戳
      tab.deletedAt = now;
      // 标记为被风吹来的
      tab.cleanedByWind = true;
      // 更新时间戳
      tab.updatedAt = now;
      tab.syncStatus = 'pending';

      await store.put(tab);
      cleanedCount++;
    }

    await tx.done;
    return cleanedCount;
  }

  /**
   * 永久删除History中超过30天的Tab
   * @returns 返回被永久删除的Tab数量
   */
  async cleanupOldHistoryTabs(): Promise<number> {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30天的毫秒数
    const now = Date.now();
    let deletedCount = 0;

    const db = await getDB();
    const tabs = await db.getAll('tabs');

    // 筛选出需要永久删除的History tabs
    const tabsToDelete = tabs.filter(tab => {
      // 必须是在History中（已删除）
      if (!tab.deletedAt) {
        return false;
      }
      // 检查是否在History中超过30天
      return now - tab.deletedAt > THIRTY_DAYS;
    });

    if (tabsToDelete.length === 0) {
      return 0;
    }

    // 批量永久删除
    const tx = db.transaction('tabs', 'readwrite');
    const store = tx.objectStore('tabs');

    for (const tab of tabsToDelete) {
      await store.delete(tab.id);
      deletedCount++;
    }

    await tx.done;
    return deletedCount;
  }
}

// 导出单例
export const tabService = new TabService();
