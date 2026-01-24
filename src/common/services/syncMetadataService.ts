/**
 * 同步元数据服务
 */

import { getDB } from '../utils/storage';
import type { SyncMetadata, SyncStatus } from '../types/sync';
import { SyncStatus as SyncStatusEnum, SYNC_METADATA_KEY } from '../types/sync';

/**
 * 同步元数据服务
 */
class SyncMetadataService {
  /**
   * 获取同步元数据
   */
  async get(): Promise<SyncMetadata> {
    const db = await getDB();
    // 使用内联键
    const metadata = await db.get('syncMetadata', SYNC_METADATA_KEY);

    if (!metadata) {
      const defaultMetadata: SyncMetadata = {
        id: SYNC_METADATA_KEY,
        lastSyncTime: 0,
        localVersion: 0,
        status: SyncStatusEnum.IDLE,
        pendingChanges: 0,
      };
      await this.save(defaultMetadata);
      return defaultMetadata;
    }

    return metadata;
  }

  /**
   * 保存同步元数据
   */
  async save(metadata: SyncMetadata): Promise<void> {
    const db = await getDB();
    // 确保使用正确的 key，并使用内联键
    const metadataToSave = {
      ...metadata,
      id: SYNC_METADATA_KEY,
    };
    await db.put('syncMetadata', metadataToSave);
  }

  /**
   * 更新同步状态
   */
  async updateStatus(status: SyncStatus, errorMessage?: string): Promise<void> {
    const metadata = await this.get();
    metadata.status = status;
    if (errorMessage) {
      metadata.errorMessage = errorMessage;
    }
    await this.save(metadata);
  }

  /**
   * 标记同步开始
   */
  async markSyncing(): Promise<void> {
    const metadata = await this.get();
    metadata.status = SyncStatusEnum.SYNCING;
    metadata.errorMessage = undefined;
    await this.save(metadata);
  }

  /**
   * 标记同步完成
   */
  async markCompleted(): Promise<void> {
    const metadata = await this.get();
    metadata.status = SyncStatusEnum.IDLE;
    metadata.lastSyncTime = Date.now();
    metadata.pendingChanges = 0;
    metadata.errorMessage = undefined;
    await this.save(metadata);
  }

  /**
   * 标记同步失败
   */
  async markFailed(errorMessage: string): Promise<void> {
    const metadata = await this.get();
    metadata.status = SyncStatusEnum.ERROR;
    metadata.errorMessage = errorMessage;
    await this.save(metadata);
  }

  /**
   * 增加本地版本号
   */
  async incrementLocalVersion(): Promise<number> {
    const metadata = await this.get();
    metadata.localVersion++;
    await this.save(metadata);
    return metadata.localVersion;
  }

  /**
   * 更新服务器版本号
   */
  async updateServerVersion(version: number): Promise<void> {
    const metadata = await this.get();
    metadata.serverVersion = version;
    await this.save(metadata);
  }

  /**
   * 更新待同步变更数量
   */
  async updatePendingChanges(count: number): Promise<void> {
    const metadata = await this.get();
    metadata.pendingChanges = count;
    await this.save(metadata);
  }

  /**
   * 增加待同步变更数量
   */
  async incrementPendingChanges(delta: number = 1): Promise<number> {
    const metadata = await this.get();
    metadata.pendingChanges += delta;
    await this.save(metadata);
    return metadata.pendingChanges;
  }

  /**
   * 重置同步元数据
   */
  async reset(): Promise<void> {
    const defaultMetadata: SyncMetadata = {
      id: SYNC_METADATA_KEY,
      lastSyncTime: 0,
      localVersion: 0,
      status: SyncStatusEnum.IDLE,
      pendingChanges: 0,
    };
    await this.save(defaultMetadata);
  }

  /**
   * 获取最后同步时间
   */
  async getLastSyncTime(): Promise<number> {
    const metadata = await this.get();
    return metadata.lastSyncTime;
  }

  /**
   * 检查是否正在同步
   */
  async isSyncing(): Promise<boolean> {
    const metadata = await this.get();
    return metadata.status === SyncStatusEnum.SYNCING;
  }

  /**
   * 获取同步状态
   */
  async getStatus(): Promise<SyncStatus> {
    const metadata = await this.get();
    return metadata.status;
  }
}

// 导出单例
export const syncMetadataService = new SyncMetadataService();
