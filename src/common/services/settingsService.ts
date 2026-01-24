/**
 * 设置数据访问服务
 */

import { getDB } from '../utils/storage';
import type { UserSettings, WebDavSettings, SyncSettings, ThemeMode } from '../types/settings';
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '../types/settings';
import { xorEncrypt, xorDecrypt } from '../utils/crypto';
// 静态导入 autoSyncService，避免 Vite 动态导入产生的预加载器在 Service Worker 中访问 window/document
import { autoSyncService } from './autoSync';

/**
 * 设置数据访问层
 */
class SettingsService {
  /**
   * 获取所有设置
   */
  async get(): Promise<UserSettings> {
    const db = await getDB();
    // 使用内联键，不需要传 key 参数
    const settings = await db.get('settings', SETTINGS_KEY);

    if (!settings) {
      // 返回默认设置
      await this.save(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }

    let needsSave = false;

    // 确保sync对象存在（兼容旧数据）
    if (!settings.sync) {
      settings.sync = { ...DEFAULT_SETTINGS.sync };
      needsSave = true;
    }

    // 确保新字段存在（兼容旧数据）
    if (typeof settings.closeAfterCollect !== 'boolean') {
      settings.closeAfterCollect = DEFAULT_SETTINGS.closeAfterCollect;
      needsSave = true;
    }

    // 确保 language 字段存在（兼容旧数据）
    if (!settings.language) {
      settings.language = DEFAULT_SETTINGS.language;
      needsSave = true;
    }

    // 如果有新增字段，需要保存到数据库
    if (needsSave) {
      await this.save(settings);
    }

    // 解密密码
    if (settings.webdav.password) {
      settings.webdav.password = xorDecrypt(settings.webdav.password);
    }

    return settings;
  }

  /**
   * 保存设置
   */
  async save(settings: UserSettings): Promise<void> {
    const db = await getDB();

    // 加密密码
    const settingsToSave: UserSettings = {
      id: SETTINGS_KEY,
      theme: settings.theme,
      language: settings.language,
      notificationsEnabled: settings.notificationsEnabled,
      closeAfterCollect: settings.closeAfterCollect,
      showUnsyncedBadge: settings.showUnsyncedBadge,
      confirmSingleDelete: settings.confirmSingleDelete,
      webdav: {
        url: settings.webdav.url,
        username: settings.webdav.username,
        password: settings.webdav.password ? xorEncrypt(settings.webdav.password) : '',
      },
      sync: {
        autoSyncEnabled: settings.sync.autoSyncEnabled,
        autoSyncInterval: settings.sync.autoSyncInterval,
        syncOnStartup: settings.sync.syncOnStartup,
        conflictStrategy: settings.sync.conflictStrategy,
      },
    };

    // 使用内联键，不需要传 key 参数
    await db.put('settings', settingsToSave);
  }

  /**
   * 保存设置并重启自动同步
   * 注意：使用静态导入 autoSyncService，避免 Vite 动态导入产生的预加载器在 Service Worker 中访问 window/document
   */
  async saveAndRestartSync(newSettings: UserSettings): Promise<void> {
    const oldSettings = await this.get();

    await this.save(newSettings);

    // 检查同步设置是否变更
    if (
      oldSettings.sync.autoSyncEnabled !== newSettings.sync.autoSyncEnabled ||
      oldSettings.sync.autoSyncInterval !== newSettings.sync.autoSyncInterval
    ) {
      await autoSyncService.restart();
    }
  }

  /**
   * 重置设置为默认值
   */
  async reset(): Promise<UserSettings> {
    await this.save(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  /**
   * 获取WebDav设置
   */
  async getWebDavSettings(): Promise<WebDavSettings> {
    const settings = await this.get();
    return settings.webdav;
  }

  /**
   * 保存WebDav设置
   */
  async saveWebDavSettings(webdav: Partial<WebDavSettings>): Promise<void> {
    const settings = await this.get();

    // 如果提供了新密码，使用它；否则保留原来的（已解密的）
    const newPassword = webdav.password || settings.webdav.password;

    settings.webdav = {
      ...settings.webdav,
      ...webdav,
      password: newPassword || '',
    };

    await this.save(settings);
  }

  /**
   * 获取同步设置
   */
  async getSyncSettings(): Promise<SyncSettings> {
    const settings = await this.get();
    return settings.sync;
  }

  /**
   * 保存同步设置
   */
  async saveSyncSettings(sync: Partial<SyncSettings>): Promise<void> {
    const settings = await this.get();
    settings.sync = {
      ...settings.sync,
      ...sync,
    };
    await this.save(settings);
  }

  /**
   * 获取主题设置
   */
  async getTheme(): Promise<ThemeMode> {
    const settings = await this.get();
    return settings.theme;
  }

  /**
   * 设置主题
   */
  async setTheme(theme: ThemeMode): Promise<void> {
    const settings = await this.get();
    settings.theme = theme;
    await this.save(settings);
  }

  /**
   * 获取语言设置
   */
  async getLanguage(): Promise<string> {
    const settings = await this.get();
    return settings.language || 'zh-CN';
  }

  /**
   * 设置语言
   */
  async setLanguage(language: string): Promise<void> {
    const settings = await this.get();
    settings.language = language;
    await this.save(settings);
  }

  /**
   * 检查WebDav是否已配置
   */
  async isWebDavConfigured(): Promise<boolean> {
    const webdav = await this.getWebDavSettings();
    return !!(webdav.url && webdav.username && webdav.password);
  }

  /**
   * 检查自动同步是否启用
   */
  async isAutoSyncEnabled(): Promise<boolean> {
    const sync = await this.getSyncSettings();
    return sync.autoSyncEnabled;
  }

  /**
   * 获取自动同步间隔（分钟）
   */
  async getAutoSyncInterval(): Promise<number> {
    const sync = await this.getSyncSettings();
    return sync.autoSyncInterval;
  }

  /**
   * 导出设置（不包含加密密码）
   */
  async export(): Promise<Omit<UserSettings, 'webdav'> & { webdav: Partial<WebDavSettings> }> {
    const settings = await this.get();
    return {
      ...settings,
      webdav: {
        url: settings.webdav.url,
        username: settings.webdav.username,
        // 不导出密码
      },
    };
  }

  /**
   * 导入设置
   */
  async import(settings: Partial<UserSettings>): Promise<void> {
    const current = await this.get();
    const merged = {
      ...current,
      ...settings,
      webdav: {
        ...current.webdav,
        ...(settings.webdav || {}),
      },
      sync: {
        ...current.sync,
        ...(settings.sync || {}),
      },
    };
    await this.save(merged);
  }
}

// 导出单例
export const settingsService = new SettingsService();
