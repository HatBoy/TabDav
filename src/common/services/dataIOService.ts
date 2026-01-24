/**
 * 数据导入导出服务
 * 独立于同步引擎，确保不影响同步功能
 * 使用Map-based数据结构 (Record<string, T>)
 */

import { tabService } from './tabService';
import { groupService } from './groupService';
import { getDB } from '../utils/storage';

/**
 * Group数据（Map格式）
 */
export interface GroupData {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Tab数据（Map格式）
 */
export interface TabData {
  url: string;
  title: string;
  favicon?: string;
  groupId?: string;
  createdAt: number;
  updatedAt: number;
  note?: string;
  tags?: string[];
}

/**
 * 导出数据格式（Map-based）
 */
export interface ExportData {
  version: number;
  exportedAt: number;
  groups: Record<string, GroupData>; // Key = Group ID
  tabs: Record<string, TabData>; // Key = URL
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean;
  message: string;
  tabsAdded: number;
  groupsAdded: number;
  orphanedTabsFixed: number;
}

/**
 * 清除结果
 */
export interface ClearResult {
  success: boolean;
  message: string;
}

/**
 * 数据导入导出服务类
 */
class DataIOService {
  /**
   * 导出所有数据（Map格式）
   */
  async exportAll(): Promise<ExportData> {
    const tabs = await tabService.getAll();
    const groups = await groupService.getAll();

    // 转换为Map格式：groups[id] = GroupData
    const groupsMap: Record<string, GroupData> = {};
    for (const group of groups) {
      groupsMap[group.id] = {
        id: group.id,
        name: group.name,
        color: group.color || '#3b82f6',
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      };
    }

    // 转换为Map格式：tabs[url] = TabData
    const tabsMap: Record<string, TabData> = {};
    for (const tab of tabs) {
      tabsMap[tab.url] = {
        url: tab.url,
        title: tab.title,
        favicon: tab.favicon,
        groupId: tab.groupId,
        createdAt: tab.createdAt,
        updatedAt: tab.updatedAt,
        note: tab.note,
        tags: tab.tags,
      };
    }

    return {
      version: 1,
      exportedAt: Date.now(),
      groups: groupsMap,
      tabs: tabsMap,
    };
  }

  /**
   * 导入数据（智能合并，本地优先）
   *
   * 策略：
   * 1. Groups: 按ID去重，本地存在则保留本地
   * 2. Tabs: 按URL去重，本地存在则保留本地
   * 3. 完整性检查: 删除引用不存在group的groupId
   * 4. 不更新sync_snapshot（让下次同步将导入数据视为新数据）
   */
  async importData(data: ExportData): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      message: '',
      tabsAdded: 0,
      groupsAdded: 0,
      orphanedTabsFixed: 0,
    };

    try {
      // 验证数据格式
      if (!data.groups || typeof data.groups !== 'object') {
        data.groups = {};
      }
      if (!data.tabs || typeof data.tabs !== 'object') {
        data.tabs = {};
      }

      // 获取现有数据
      const existingTabs = await tabService.getAll();
      const existingGroups = await groupService.getAll();

      // 创建现有数据的Map（用于快速查找）
      const existingGroupIds = new Set(existingGroups.map(g => g.id));
      const existingTabUrls = new Set(existingTabs.map(t => t.url.toLowerCase()));

      // Step 1: 导入Groups（本地优先）
      const db = await getDB();
      const importedGroups: GroupData[] = [];

      for (const [groupId, groupData] of Object.entries(data.groups)) {
        if (!existingGroupIds.has(groupId)) {
          // 新分组，直接保存到IndexedDB（保留导入的ID）
          const group = {
            id: groupData.id,
            name: groupData.name,
            color: groupData.color || '#3b82f6',
            createdAt: groupData.createdAt,
            updatedAt: groupData.updatedAt,
            tabCount: 0, // 稍后刷新
          };
          await db.put('groups', group);
          importedGroups.push(groupData);
          result.groupsAdded++;
        }
      }

      // 重新获取所有groups（包括刚导入的）
      const allGroups = await groupService.getAll();
      const allGroupIds = new Set(allGroups.map(g => g.id));

      // Step 2: 导入Tabs（本地优先）+ 完整性检查
      for (const [url, tabData] of Object.entries(data.tabs)) {
        const urlKey = url.toLowerCase();

        if (!existingTabUrls.has(urlKey)) {
          // 新Tab，检查完整性
          let finalGroupId = tabData.groupId;

          // 完整性检查：如果groupId引用的group不存在，删除groupId
          if (finalGroupId && !allGroupIds.has(finalGroupId)) {
            console.warn(
              '[DataIO] 发现孤立Tab:',
              tabData.title,
              '引用的分组不存在:',
              finalGroupId
            );
            finalGroupId = undefined; // 删除无效的groupId
            result.orphanedTabsFixed++;
          }

          // 使用tabService.add保存（会自动生成新的tab ID）
          await tabService.add({
            url: tabData.url,
            title: tabData.title,
            favicon: tabData.favicon,
            groupId: finalGroupId,
            note: tabData.note,
            tags: tabData.tags,
          });

          result.tabsAdded++;
        }
      }

      // Step 3: 刷新分组Tab数量
      await groupService.refreshAllTabCounts();

      // 生成消息
      const parts: string[] = [];
      if (result.tabsAdded > 0) {
        parts.push(`${result.tabsAdded} tabs`);
      }
      if (result.groupsAdded > 0) {
        parts.push(`${result.groupsAdded} groups`);
      }
      if (result.orphanedTabsFixed > 0) {
        parts.push(`${result.orphanedTabsFixed} orphaned tabs fixed`);
      }

      result.message =
        parts.length > 0 ? `Imported ${parts.join(', ')}` : 'No new data to import';

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[DataIO] 导入失败:', error);
      return {
        success: false,
        message: `Import failed: ${errorMessage}`,
        tabsAdded: 0,
        groupsAdded: 0,
        orphanedTabsFixed: 0,
      };
    }
  }

  /**
   * 清除所有数据（安全重置）
   *
   * 删除：
   * - tabs（IndexedDB）
   * - groups（IndexedDB）
   * - pendingChanges（IndexedDB）
   * - tabdav_sync_snapshot（chrome.storage.local）
   *
   * 保留：
   * - settings（IndexedDB）
   * - syncMetadata（IndexedDB）
   * - webdav_config（chrome.storage.local）
   * - theme（chrome.storage.local）
   */
  async clearAllData(): Promise<ClearResult> {
    try {

      // 1. 清空IndexedDB中的tabs、groups、pendingChanges
      const db = await getDB();
      await db.clear('tabs');
      await db.clear('groups');
      await db.clear('pendingChanges');

      // 2. 删除chrome.storage.local中的sync_snapshot
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.remove(['tabdav_sync_snapshot'], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      return {
        success: true,
        message: 'All data cleared. Settings retained.',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[DataIO] 清除数据失败:', error);
      return {
        success: false,
        message: `Clear failed: ${errorMessage}`,
      };
    }
  }

  /**
   * 下载JSON文件
   */
  downloadJSON(data: ExportData, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `TabDav_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || defaultFilename;
    link.click();

    URL.revokeObjectURL(url);
  }

  /**
   * 读取JSON文件
   */
  async readJSONFile(file: File): Promise<ExportData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

// 导出单例
export const dataIOService = new DataIOService();
