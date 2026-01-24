/**
 * 自动同步服务
 */

import { syncEngine } from './syncEngine';
import { syncMetadataService } from './syncMetadataService';
import { settingsService } from './settingsService';
import { AUTO_SYNC_ALARM_NAME, DEFAULT_SYNC_INTERVAL } from '../constants';

/**
 * 自动同步服务类
 */
export class AutoSyncService {
  private isRunning = false;

  /**
   * 启动自动同步
   */
  async start(): Promise<void> {
    // 读取当前设置
    const settings = await settingsService.getSyncSettings();
    if (!settings.autoSyncEnabled) {
      this.isRunning = false;
      return;
    }

    // 检查 alarm 是否已存在
    const existingAlarm = await chrome.alarms.get(AUTO_SYNC_ALARM_NAME);
    if (existingAlarm) {
      this.isRunning = true;
      return;
    }

    const interval = settings.autoSyncInterval || DEFAULT_SYNC_INTERVAL;

    // 注册定时任务 - 第一次在interval分钟后触发，之后每interval分钟重复
    await chrome.alarms.create(AUTO_SYNC_ALARM_NAME, {
      delayInMinutes: interval,
      periodInMinutes: interval
    });

    this.isRunning = true;
  }

  /**
   * 停止自动同步
   */
  async stop(): Promise<void> {
    await chrome.alarms.clear(AUTO_SYNC_ALARM_NAME);
    this.isRunning = false;
  }

  /**
   * 重启自动同步（用于设置变更时）
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  /**
   * 执行自动同步
   */
  async performSync(): Promise<void> {
    // 检查是否正在同步
    const isSyncing = await syncMetadataService.isSyncing();
    if (isSyncing) {
      return;
    }

    // 检查是否启用
    const settings = await settingsService.getSyncSettings();
    if (!settings.autoSyncEnabled) {
      return;
    }

    try {
      await syncEngine.sync();
    } catch (error) {
      // 静默处理错误
    }
  }

  /**
   * 获取同步状态
   */
  async getStatus(): Promise<{
    enabled: boolean;
    interval: number;
    isRunning: boolean;
    lastSyncTime: number;
    status: string;
  }> {
    const settings = await settingsService.getSyncSettings();
    const metadata = await syncMetadataService.get();

    return {
      enabled: settings.autoSyncEnabled,
      interval: settings.autoSyncInterval,
      isRunning: this.isRunning,
      lastSyncTime: metadata.lastSyncTime,
      status: metadata.status
    };
  }
}

// 导出单例
export const autoSyncService = new AutoSyncService();
