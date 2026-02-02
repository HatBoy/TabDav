/**
 * IndexedDB 存储工具封装
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { TabItem } from '../types/tab';
import type { Group } from '../types/group';
import type { SyncMetadata } from '../types/sync';
import type { UserSettings } from '../types/settings';

/**
 * TabDav数据库接口定义
 */
interface TabDavDB extends DBSchema {
  tabs: {
    key: string;
    value: TabItem;
    indexes: {
      'by-url': string;
      'by-title': string;
      'by-group': string;
      'by-created': number;
      'by-sync-status': string;
      'by-sync-status-keys': string;
    };
  };
  groups: {
    key: string;
    value: Group;
    indexes: {
      'by-name': string;
      'by-created': number;
    };
  };
  syncMetadata: {
    key: string;
    value: SyncMetadata & { id: string };
  };
  settings: {
    key: string;
    value: UserSettings & { id: string };
    indexes: {};
  };
  pendingChanges: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      dataType: 'tab' | 'group';
      data: unknown;
      timestamp: number;
    };
    indexes: {
      'by-timestamp': number;
    };
  };
  classifyCache: {
    key: string;
    value: {
      id: string;
      url: string;
      normalizedUrl: string;
      groupId: string | null;
      source: 'llm';
      listsFingerprint: string;
      timestamp: number;
      hitCount: number;
    };
    indexes: {
      'by-normalized-url': string;
      'by-timestamp': number;
      'by-fingerprint': string;
    };
  };
  customRules: {
    key: string;
    value: {
      id: string;
      name: string;
      pattern: string;
      patternType: 'exact' | 'prefix' | 'domain' | 'regex';
      targetGroupId: string | null;
      priority: number;
      enabled: boolean;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      'by-priority': number;
      'by-enabled': number;
      'by-created': number;
    };
  };
}

/** 数据库名称 */
const DB_NAME = 'TabDav';
/** 数据库版本 */
const DB_VERSION = 3; // 升级到版本3，添加 custom_rules
/** 数据库实例 */
let dbInstance: IDBPDatabase<TabDavDB> | null = null;

/**
 * 获取数据库实例（单例模式）
 * 注意：在 Service Worker 中，实例可能在后台被清除，需要每次验证
 */
export async function getDB(): Promise<IDBPDatabase<TabDavDB>> {
  if (dbInstance) {
    // 验证实例是否仍然有效（通过简单的查询测试）
    try {
      // 尝试访问实例，如果无效会抛出错误
      await dbInstance.transaction('tabs', 'readonly');
      return dbInstance;
    } catch {
      // 实例无效，关闭并重置
      try {
        dbInstance.close();
      } catch {
        // close 可能失败，忽略
      }
      dbInstance = null;
    }
  }

  dbInstance = await openDB<TabDavDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建 tabs 表
      if (!db.objectStoreNames.contains('tabs')) {
        const tabStore = db.createObjectStore('tabs', { keyPath: 'id' });
        tabStore.createIndex('by-url', 'url');
        tabStore.createIndex('by-title', 'title');
        tabStore.createIndex('by-group', 'groupId');
        tabStore.createIndex('by-created', 'createdAt');
        tabStore.createIndex('by-sync-status', 'syncStatus');
        // 创建只返回key的索引用于高效游标操作
        tabStore.createIndex('by-sync-status-keys', 'syncStatus', { unique: false });
      }

      // 创建 groups 表
      if (!db.objectStoreNames.contains('groups')) {
        const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
        groupStore.createIndex('by-name', 'name');
        groupStore.createIndex('by-created', 'createdAt');
      }

      // 创建 syncMetadata 表
      if (!db.objectStoreNames.contains('syncMetadata')) {
        db.createObjectStore('syncMetadata', { keyPath: 'id' });
      }

      // 创建 settings 表
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      // 创建 pendingChanges 表
      if (!db.objectStoreNames.contains('pendingChanges')) {
        const pendingStore = db.createObjectStore('pendingChanges', { keyPath: 'id' });
        pendingStore.createIndex('by-timestamp', 'timestamp');
      }

      // 创建 classifyCache 表（版本2新增）
      if (!db.objectStoreNames.contains('classifyCache')) {
        const cacheStore = db.createObjectStore('classifyCache', { keyPath: 'id' });
        cacheStore.createIndex('by-normalized-url', 'normalizedUrl');
        cacheStore.createIndex('by-timestamp', 'timestamp');
        cacheStore.createIndex('by-fingerprint', 'listsFingerprint');
      }

      // 创建 customRules 表（版本3新增）
      if (!db.objectStoreNames.contains('customRules')) {
        const ruleStore = db.createObjectStore('customRules', { keyPath: 'id' });
        ruleStore.createIndex('by-priority', 'priority');
        ruleStore.createIndex('by-enabled', 'enabled');
        ruleStore.createIndex('by-created', 'createdAt');
      }
    },
  });

  return dbInstance;
}

/**
 * 关闭数据库连接
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * 清空数据库（保留设置）
 * 只清除标签和分组数据，保留设置和同步元数据
 */
export async function clearDataOnly(): Promise<void> {
  const db = await getDB();
  await db.clear('tabs');
  await db.clear('groups');
  await db.clear('pendingChanges');
  // 保留 settings 和 syncMetadata
}

/**
 * 清空数据库（全部清除）
 */
export async function clearDB(): Promise<void> {
  const db = await getDB();
  await db.clear('tabs');
  await db.clear('groups');
  await db.clear('syncMetadata');
  await db.clear('settings');
  await db.clear('pendingChanges');
}

/**
 * 删除数据库
 */
export async function deleteDB(): Promise<void> {
  await closeDB();
  await indexedDB.deleteDatabase(DB_NAME);
}
