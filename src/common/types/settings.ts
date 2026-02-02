/**
 * 用户设置类型定义
 */

/**
 * 主题设置
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * WebDav设置
 */
export interface WebDavSettings {
  /** 服务器地址（包含同步目录） */
  url: string;
  /** 用户名 */
  username: string;
  /** 密码（加密存储） */
  password: string;
}

/**
 * 同步设置
 */
export interface SyncSettings {
  /** 是否启用自动同步 */
  autoSyncEnabled: boolean;
  /** 自动同步间隔（分钟） */
  autoSyncInterval: number;
  /** 启动浏览器时自动同步 */
  syncOnStartup: boolean;
  /** 冲突解决策略 (已废弃 - 现在使用统一的双向同步) */
  conflictStrategy?: 'local' | 'server' | 'manual';
}

/**
 * LLM模型设置
 */
export interface LLMSettings {
  /** 模型地址 */
  apiUrl: string;
  /** API密钥 */
  apiKey: string;
  /** 模型名称 */
  modelName: string;
  /** 并发数（默认1） */
  concurrency: number;
  /** 分批数（默认20） */
  batchSize: number;
  /** 重试数（默认3） */
  retryCount: number;
}

/**
 * 用户设置
 */
export interface UserSettings {
  /** 主键（用于IndexedDB） */
  id: string;
  /** WebDav配置 */
  webdav: WebDavSettings;
  /** 同步配置 */
  sync: SyncSettings;
  /** LLM模型配置 */
  llm: LLMSettings;
  /** 主题模式 */
  theme: ThemeMode;
  /** 界面语言 */
  language: string;
  /** 快捷键设置（可选） */
  keyboardShortcut?: string;
  /** 是否显示通知 */
  notificationsEnabled: boolean;
  /** 收藏后关闭页面（可选，默认关闭） */
  closeAfterCollect?: boolean;
  /** 显示未同步角标（可选，默认启用） */
  showUnsyncedBadge?: boolean;
  /** 删除单个标签时确认（可选，默认不确认） */
  confirmSingleDelete?: boolean;
}

/** 设置存储键 */
export const SETTINGS_KEY = 'user-settings';

/**
 * 设置默认值
 */
export const DEFAULT_SETTINGS: UserSettings = {
  id: SETTINGS_KEY,
  webdav: {
    url: '',
    username: '',
    password: '',
  },
  sync: {
    autoSyncEnabled: false,
    autoSyncInterval: 10,
    syncOnStartup: false,
    conflictStrategy: 'local',
  },
  llm: {
    apiUrl: '',
    apiKey: '',
    modelName: '',
    concurrency: 1,
    batchSize: 20,
    retryCount: 3,
  },
  theme: 'system',
  language: 'en',
  notificationsEnabled: true,
  closeAfterCollect: false,
  showUnsyncedBadge: true,
  confirmSingleDelete: false,
};

/**
 * 同步间隔选项
 */
export const SYNC_INTERVAL_OPTIONS = [
  { label: '5 分钟', value: 5 },
  { label: '10 分钟', value: 10 },
  { label: '15 分钟', value: 15 },
  { label: '30 分钟', value: 30 },
  { label: '60 分钟', value: 60 },
];

/**
 * 冲突策略选项
 */
export const CONFLICT_STRATEGY_OPTIONS = [
  { label: '本地优先', value: 'local', description: '使用本地数据覆盖服务器数据' },
  { label: '服务器优先', value: 'server', description: '下载服务器数据覆盖本地' },
  { label: '手动处理', value: 'manual', description: '检测到冲突时暂停同步，让用户选择' },
];
