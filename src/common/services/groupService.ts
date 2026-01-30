/**
 * 分组数据访问服务
 */

import { getDB } from '../utils/storage';
import type { Group, CreateGroupInput, UpdateGroupInput } from '../types/group';
import { generateId } from '../utils/crypto';

/**
 * 分组数据访问层
 */
class GroupService {
  /**
   * 创建分组
   */
  async create(input: CreateGroupInput): Promise<Group> {
    const db = await getDB();
    const now = Date.now();

    const group: Group = {
      id: generateId(),
      name: input.name,
      color: input.color,
      listType: input.listType,
      createdAt: now,
      updatedAt: now,
      tabCount: 0,
    };

    await db.put('groups', group);
    return group;
  }

  /**
   * 更新分组
   */
  async update(input: UpdateGroupInput): Promise<Group | null> {
    const db = await getDB();
    const existing = await db.get('groups', input.id);

    if (!existing) {
      return null;
    }

    const updated: Group = {
      ...existing,
      name: input.name ?? existing.name,
      color: input.color ?? existing.color,
      updatedAt: Date.now(),
    };

    await db.put('groups', updated);
    return updated;
  }

  /**
   * 删除分组
   * @param deleteTabs 是否同时删除分组下的Tab
   */
  async delete(id: string, deleteTabs: boolean = false): Promise<boolean> {
    const db = await getDB();
    const existing = await db.get('groups', id);

    if (!existing) {
      return false;
    }

    // 如果不删除Tab，将它们移到未分组状态（groupId 设为 undefined）
    // 使用单个事务避免竞态条件
    if (!deleteTabs) {
      const tx = db.transaction(['tabs', 'groups'], 'readwrite');
      const tabStore = tx.objectStore('tabs');
      const groupStore = tx.objectStore('groups');

      // 使用索引查询同一事务中的 tabs
      const index = tabStore.index('by-group');
      const tabs = await index.getAll(id);

      for (const tab of tabs) {
        tab.groupId = undefined;
        tab.updatedAt = Date.now();
        await tabStore.put(tab);
      }

      // 删除分组
      await groupStore.delete(id);

      await tx.done;
    } else {
      // 如果删除Tab，只需删除分组（Tab已通过级联删除处理或不需要处理）
      await db.delete('groups', id);
    }

    return true;
  }

  /**
   * 根据ID获取分组
   */
  async getById(id: string): Promise<Group | null> {
    const db = await getDB();
    return (await db.get('groups', id)) ?? null;
  }

  /**
   * 获取所有分组
   */
  async getAll(): Promise<Group[]> {
    const db = await getDB();
    const groups = await db.getAll('groups');
    return groups;
  }

  /**
   * 根据名称获取分组
   */
  async getByName(name: string): Promise<Group | null> {
    const db = await getDB();
    const groups = await db.getAllFromIndex('groups', 'by-name', name);
    return groups[0] ?? null;
  }

  /**
   * 更新分组中的Tab数量
   * 使用显式事务确保读写一致性
   */
  async updateTabCount(id: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(['groups', 'tabs'], 'readwrite');
    const groupStore = tx.objectStore('groups');
    const tabStore = tx.objectStore('tabs');

    const group = await groupStore.get(id);
    if (!group) {
      await tx.done;
      return;
    }

    // 使用索引获取所有属于该分组的tabs，然后在同一事务中过滤
    const index = tabStore.index('by-group');
    const allTabs = await index.getAll(id);
    const activeTabs = allTabs.filter(tab => !tab.deletedAt);

    group.tabCount = activeTabs.length;
    group.updatedAt = Date.now();
    await groupStore.put(group);

    // 等待事务完成确保数据已提交
    await tx.done;
  }

  /**
   * 刷新所有分组的Tab数量
   */
  async refreshAllTabCounts(): Promise<void> {
    const db = await getDB();
    const groups = await db.getAll('groups');

    for (const group of groups) {
      await this.updateTabCount(group.id);
    }
  }

  /**
   * 获取分组统计
   */
  async getStats(): Promise<{
    totalGroups: number;
    totalTabs: number;
    groups: Array<Group & { percentage: number }>;
  }> {
    const db = await getDB();
    const groups = await this.getAll();
    const allTabs = await db.getAll('tabs');

    const totalTabs = allTabs.length;
    const groupsWithPercentage = groups.map(group => ({
      ...group,
      percentage: totalTabs > 0 ? Math.round((group.tabCount / totalTabs) * 100) : 0,
    }));

    return {
      totalGroups: groups.length,
      totalTabs,
      groups: groupsWithPercentage,
    };
  }

  /**
   * 检查分组名称是否已存在
   */
  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const db = await getDB();
    const groups = await db.getAllFromIndex('groups', 'by-name', name);

    if (excludeId) {
      return groups.some(g => g.id !== excludeId);
    }
    return groups.length > 0;
  }

  /**
   * 批量删除分组（不删除Tab）
   */
  async bulkDelete(ids: string[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.delete(id, false);
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }
}

// 导出单例
export const groupService = new GroupService();
