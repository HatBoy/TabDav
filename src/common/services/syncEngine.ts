/**
 * 同步引擎
 */

import { tabService } from './tabService';
import { groupService } from './groupService';
import { syncMetadataService } from './syncMetadataService';
import { WebDavClient, createClientFromSettings } from './webdavClient';
import type { ExportData, TabData, GroupData, SyncResult } from '../types/sync';
import type { TabItem } from '../types/tab';
import type { Group } from '../types/group';
import { SyncStatus, SYNC_METADATA_KEY } from '../types/sync';
import { getDB } from '../utils/storage';

// 快照存储key
const SNAPSHOT_STORAGE_KEY = 'tabdav_sync_snapshot';

/**
 * 同步引擎类
 */
export class SyncEngine {
  private client: WebDavClient | null = null;
  private isSyncing = false;

  /**
   * 初始化同步引擎
   */
  async init(): Promise<void> {
    this.client = await createClientFromSettings();
  }

  /**
   * 检查是否已配置
   */
  async isConfigured(): Promise<boolean> {
    await this.init();
    return this.client !== null;
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      this.client = await createClientFromSettings();
    } catch (error) {
      console.error('[SyncEngine] 创建客户端失败:', error);
      return { success: false, message: '配置读取失败' };
    }

    if (!this.client) {
      return { success: false, message: '请先配置WebDav服务器地址、用户名和密码' };
    }

    const result = await this.client.testConnection();

    return {
      success: result.success,
      message: result.message,
    };
  }

  /**
   * 执行同步 - 三路合并同步逻辑
   *
   * 同步策略：
   * 1. 获取本地数据、快照数据和远程数据
   * 2. 使用三路合并算法（L-S-R）检测新增、修改、删除
   * 3. 将合并结果上传到服务器
   * 4. 导入合并结果到本地
   * 5. 保存新的快照
   *
   * 核心原则：
   * - 新增：本地/远程有新数据 → 同步到对端
   * - 修改：任一端修改 → 取最新版本同步
   * - 删除：通过快照检测删除操作 → 同步删除
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        error: '同步已在进行中',
        timestamp: Date.now(),
      };
    }

    this.isSyncing = true;
    await syncMetadataService.markSyncing();

    try {
      // 获取WebDav客户端
      this.client = await createClientFromSettings();
      if (!this.client) {
        throw new Error('请先配置WebDav服务器');
      }

      // 确保同步目录存在
      await this.ensureSyncDirectory();

      // 导出本地数据
      const localData = await this.exportLocalData();
      localData.syncMetadata.localVersion = (await syncMetadataService.get()).localVersion + 1;

      // 加载快照数据（上次同步的状态）
      const snapshotData = await this.loadSnapshot();

      // 下载远程数据
      const remoteResult = await this.client.download(this.client.getDataPath());
      let remoteData: ExportData | null = null;

      if (remoteResult.success && remoteResult.data) {
        try {
          remoteData = JSON.parse(remoteResult.data);
        } catch {
          console.warn('解析远程数据失败，将使用本地数据');
        }
      }

      // 合并数据 - 使用三路合并逻辑（L-S-R）
      const { mergedTabs, mergedGroups } = await this.mergeData(
        localData.tabs,
        localData.groups,
        snapshotData?.tabs || [],
        snapshotData?.groups || [],
        remoteData?.tabs || [],
        remoteData?.groups || []
      );

      // 准备导出数据
      const exportData: ExportData = {
        version: 1,
        exportedAt: Date.now(),
        tabs: mergedTabs,
        groups: mergedGroups,
        syncMetadata: {
          id: SYNC_METADATA_KEY,
          lastSyncTime: Date.now(),
          localVersion: localData.syncMetadata.localVersion,
          serverVersion: remoteData?.syncMetadata?.localVersion || 0,
          status: SyncStatus.IDLE,
          pendingChanges: 0,
        },
      };

      // 上传合并后的数据
      const uploadResult = await this.client.upload(
        JSON.stringify(exportData),
        this.client.getDataPath()
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.message);
      }

      // 更新本地数据
      await this.importData(exportData);

      // 同步完成后，将所有 Tab 标记为已同步
      // 注意：这必须在 importData 之后执行
      await tabService.markAllSynced();

      // 更新同步元数据
      await syncMetadataService.markCompleted();
      await syncMetadataService.incrementLocalVersion();

      // 保存快照（用于下次同步的三路合并）
      try {
        await this.saveSnapshot(exportData);
      } catch (error) {
        console.error('[SyncEngine] ❌ 快照保存失败:', error);
        // 快照保存失败不应该导致整个同步失败，但需要记录错误
        // 下次同步时可能会出现问题，因为没有快照来检测删除操作
      }

      // 计算统计数据
      const localUrls = new Set(localData.tabs.map((t: TabData) => t.url.toLowerCase()));
      const remoteUrls = new Set((remoteData?.tabs || []).map((t: TabData) => t.url.toLowerCase()));
      const mergedUrls = new Set(mergedTabs.map((t: TabData) => t.url.toLowerCase()));

      let uploaded = 0,
        downloaded = 0;
      for (const url of mergedUrls) {
        if (!localUrls.has(url) && remoteUrls.has(url)) downloaded++;
        else if (localUrls.has(url) && !remoteUrls.has(url)) uploaded++;
        else if (!localUrls.has(url) && !remoteUrls.has(url)) uploaded++;
      }

      return {
        success: true,
        uploaded,
        downloaded,
        conflicts: 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await syncMetadataService.markFailed(errorMessage);

      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        conflicts: 0,
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 导入数据 - 使用URL作为唯一标识符
   * 规则：
   * - 创建或更新本地Tab
   */
  private async importData(data: ExportData): Promise<void> {
    // 获取现有数据
    const existingTabs = await tabService.getAll();
    const existingGroups = await groupService.getAll();

    // 创建现有数据的映射（按URL和ID，用于快速查找）
    const existingTabMap = new Map(existingTabs.map(t => [t.url.toLowerCase(), t]));
    const existingGroupMap = new Map(existingGroups.map(g => [g.id, g]));

    // 导入/更新分组（按 ID 去重，保留远程 ID）
    const db = await getDB();
    for (const groupData of data.groups) {
      const existing = existingGroupMap.get(groupData.id);

      if (!existing) {
        // 新分组，直接使用远程的 ID 创建
        const group: Group = {
          id: groupData.id, // 使用远程 ID
          name: groupData.name,
          color: groupData.color,
          createdAt: groupData.createdAt,
          updatedAt: groupData.updatedAt,
          tabCount: 0,
        };
        await db.put('groups', group);
      } else if (existing.updatedAt !== groupData.updatedAt) {
        // 现有分组且有更新，更新
        await groupService.update({
          id: existing.id,
          name: groupData.name,
          color: groupData.color,
        });
      }
    }

    // 导入/更新Tab（按URL去重）
    for (const tabData of data.tabs) {
      const urlKey = tabData.url.toLowerCase();
      const existing = existingTabMap.get(urlKey);

      if (!existing) {
        // 新Tab，创建
        await tabService.add({
          url: tabData.url,
          title: tabData.title,
          favicon: tabData.favicon,
          groupId: tabData.groupId,
          note: tabData.note,
          tags: tabData.tags,
        });
      } else if (existing.updatedAt !== tabData.updatedAt) {
        // 现有Tab且有更新，更新
        await tabService.update({
          id: existing.id,
          url: tabData.url,
          title: tabData.title,
          favicon: tabData.favicon,
          groupId: tabData.groupId,
          note: tabData.note,
          tags: tabData.tags,
        });
      }
    }

    // 删除本地存在但合并结果中不存在的Tabs（三路合并判定应该删除的）
    const mergedTabUrls = new Set(data.tabs.map(t => t.url.toLowerCase()));
    const tabsToDelete: string[] = [];
    for (const [urlKey, existingTab] of existingTabMap) {
      if (!mergedTabUrls.has(urlKey)) {
        tabsToDelete.push(existingTab.id);
      }
    }
    if (tabsToDelete.length > 0) {
      await tabService.bulkDelete(tabsToDelete);
    }

    // 删除本地存在但合并结果中不存在的Groups
    const mergedGroupIds = new Set(data.groups.map(g => g.id));
    const groupsToDelete: string[] = [];
    for (const [groupId] of existingGroupMap) {
      if (!mergedGroupIds.has(groupId)) {
        groupsToDelete.push(groupId);
      }
    }
    if (groupsToDelete.length > 0) {
      for (const groupId of groupsToDelete) {
        await groupService.delete(groupId, false); // false = 不删除分组下的tabs，只移到未分组
      }
    }

    // 更新分组Tab数量
    await groupService.refreshAllTabCounts();
  }

  /**
   * 导出本地数据
   */
  private async exportLocalData(): Promise<ExportData> {
    const tabs = await tabService.getAll();
    const groups = await groupService.getAll();
    const metadata = await syncMetadataService.get();

    return {
      version: 1,
      exportedAt: Date.now(),
      tabs: tabs.map(this.tabToExportData),
      groups: groups.map(this.groupToExportData),
      syncMetadata: metadata,
    };
  }

  /**
   * 合并数据 - 三路合并算法（L-S-R）
   *
   * 逻辑矩阵：
   * | Local(L) | Snapshot(S) | Remote(R) | Action              | Reasoning                          |
   * |----------|-------------|-----------|---------------------|------------------------------------|
   * | Null     | Null        | Exists    | ADD to Local        | New data from another device       |
   * | Exists   | Null        | Null      | ADD to Remote       | New data created locally           |
   * | Null     | Exists      | Exists    | DELETE from Remote  | User deleted it locally            |
   * | Exists   | Exists      | Null      | DELETE from Local   | User deleted it on other device    |
   * | Exists   | Null        | Exists    | Keep Newer          | Zombie case, L is new              |
   * | Exists   | Exists      | Exists    | Keep Newer          | Both modified, compare updatedAt   |
   *
   * 核心原则：
   * 1. 使用 URL 作为 Tab 的唯一标识符
   * 2. 使用 ID 作为 Group 的唯一标识符
   * 3. 通过快照检测删除操作
   */
  private async mergeData(
    localTabs: TabData[],
    localGroups: GroupData[],
    snapshotTabs: TabData[],
    snapshotGroups: GroupData[],
    remoteTabs: TabData[],
    remoteGroups: GroupData[]
  ): Promise<{
    mergedTabs: TabData[];
    mergedGroups: GroupData[];
  }> {
    // ========== 合并 Tabs (基于 URL，三路合并) ==========
    const localTabMap = new Map(localTabs.map(t => [t.url.toLowerCase(), t]));
    const snapshotTabMap = new Map(snapshotTabs.map(t => [t.url.toLowerCase(), t]));
    const remoteTabMap = new Map(remoteTabs.map(t => [t.url.toLowerCase(), t]));

    // 获取所有唯一的URL
    const allUrls = new Set([
      ...localTabMap.keys(),
      ...snapshotTabMap.keys(),
      ...remoteTabMap.keys(),
    ]);

    const mergedTabMap = new Map<string, TabData>();

    for (const urlKey of allUrls) {
      const L = localTabMap.get(urlKey);
      const S = snapshotTabMap.get(urlKey);
      const R = remoteTabMap.get(urlKey);

      const title = L?.title || S?.title || R?.title || 'Unknown';

      // Case 1: L=null, S=null, R=exists → ADD to Local
      if (!L && !S && R) {
        mergedTabMap.set(urlKey, R);
        continue;
      }

      // Case 2: L=exists, S=null, R=null → ADD to Remote
      if (L && !S && !R) {
        mergedTabMap.set(urlKey, L);
        continue;
      }

      // Case 3: L=null, S=exists, R=exists → DELETE from Remote
      // User deleted it locally (present in S but not in L)
      if (!L && S && R) {
        // Don't add to merged map (physical deletion)
        continue;
      }

      // Case 4: L=exists, S=exists, R=null → DELETE from Local
      // User deleted it on another device
      if (L && S && !R) {
        // Don't add to merged map (physical deletion)
        continue;
      }

      // Case 5: L=exists, S=null, R=exists → Keep Newer (Zombie)
      if (L && !S && R) {
        const newer = L.updatedAt >= R.updatedAt ? L : R;
        mergedTabMap.set(urlKey, newer);
        continue;
      }

      // Case 6: L=exists, S=exists, R=exists → Keep Newer (Conflict)
      if (L && S && R) {
        const newer = L.updatedAt >= R.updatedAt ? L : R;
        mergedTabMap.set(urlKey, newer);
        continue;
      }

      // Case 7: L=null, S=exists, R=null → Already deleted on both sides
      if (!L && S && !R) {
        // Don't add to merged map
        continue;
      }

      // Should not reach here
      console.warn(`[SyncEngine] ⚠️ Tab unhandled case: ${title}, L=${!!L}, S=${!!S}, R=${!!R}`);
    }

    // ========== 合并 Groups (基于 ID，三路合并) ==========
    const localGroupMap = new Map(localGroups.map(g => [g.id, g]));
    const snapshotGroupMap = new Map(snapshotGroups.map(g => [g.id, g]));
    const remoteGroupMap = new Map(remoteGroups.map(g => [g.id, g]));

    // 获取所有唯一的Group ID
    const allGroupIds = new Set([
      ...localGroupMap.keys(),
      ...snapshotGroupMap.keys(),
      ...remoteGroupMap.keys(),
    ]);

    const mergedGroupMap = new Map<string, GroupData>();

    for (const groupId of allGroupIds) {
      const L = localGroupMap.get(groupId);
      const S = snapshotGroupMap.get(groupId);
      const R = remoteGroupMap.get(groupId);

      // Case 1: L=null, S=null, R=exists → ADD to Local
      if (!L && !S && R) {
        mergedGroupMap.set(groupId, R);
        continue;
      }

      // Case 2: L=exists, S=null, R=null → ADD to Remote
      if (L && !S && !R) {
        mergedGroupMap.set(groupId, L);
        continue;
      }

      // Case 3: L=null, S=exists, R=exists → DELETE from Remote
      if (!L && S && R) {
        continue;
      }

      // Case 4: L=exists, S=exists, R=null → DELETE from Local
      if (L && S && !R) {
        continue;
      }

      // Case 5: L=exists, S=null, R=exists → Keep Newer (Zombie)
      if (L && !S && R) {
        const newer = L.updatedAt >= R.updatedAt ? L : R;
        mergedGroupMap.set(groupId, newer);
        continue;
      }

      // Case 6: L=exists, S=exists, R=exists → Keep Newer (Conflict)
      if (L && S && R) {
        const newer = L.updatedAt >= R.updatedAt ? L : R;
        mergedGroupMap.set(groupId, newer);
        continue;
      }
    }

    const mergedTabs = Array.from(mergedTabMap.values());
    const mergedGroups = Array.from(mergedGroupMap.values());

    return { mergedTabs, mergedGroups };
  }

  /**
   * 转换为导出数据
   */
  private tabToExportData(tab: TabItem): TabData {
    return {
      id: tab.id,
      url: tab.url,
      title: tab.title,
      favicon: tab.favicon,
      groupId: tab.groupId,
      createdAt: tab.createdAt,
      updatedAt: tab.updatedAt,
      lastVisited: tab.lastVisited,
      note: tab.note,
      tags: tab.tags,
    };
  }

  /**
   * 转换为导出数据
   */
  private groupToExportData(group: Group): GroupData {
    return {
      id: group.id,
      name: group.name,
      color: group.color,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  /**
   * 确保同步目录存在
   */
  private async ensureSyncDirectory(): Promise<void> {
    if (!this.client) return;

    const dataPath = this.client.getDataPath();
    const dirPath = dataPath.split('/').slice(0, -1).join('/') || '/';
    const exists = await this.client.exists(dirPath);
    if (!exists) {
      await this.client.mkdir(dirPath || dataPath);
    }
  }

  /**
   * 加载快照（上次同步的状态）
   */
  private async loadSnapshot(): Promise<ExportData | null> {
    return new Promise(resolve => {
      chrome.storage.local.get(SNAPSHOT_STORAGE_KEY, result => {
        const snapshot = result[SNAPSHOT_STORAGE_KEY] as ExportData | undefined;
        resolve(snapshot || null);
      });
    });
  }

  /**
   * 保存快照（用于下次同步的三路合并）
   */
  private async saveSnapshot(data: ExportData): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [SNAPSHOT_STORAGE_KEY]: data }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

// 导出单例
export const syncEngine = new SyncEngine();
