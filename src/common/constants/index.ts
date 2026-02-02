/**
 * 公共常量定义
 */

/** 插件名称 */
export const APP_NAME = 'TabDav';

/** 插件版本 */
export const APP_VERSION = '1.0.0';

/** 数据库名称 */
export const DB_NAME = 'TabDav';

/** 数据库版本 */
export const DB_VERSION = 1;

/** 存储容量限制（100MB） */
export const STORAGE_QUOTA = 100 * 1024 * 1024;

/** 单个Tab收藏限制 */
export const MAX_TABS_PER_OPERATION = 100;

/** 最大总收藏数（0表示无限制） */
export const MAX_TOTAL_TABS = 0;

/** Favicon缓存过期时间（7天） */
export const FAVICON_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

/** 默认同步目录 */
export const DEFAULT_SYNC_PATH = '/tabdav/';

/** 默认同步间隔（分钟） */
export const DEFAULT_SYNC_INTERVAL = 10;

/** WebDav连接超时（10秒） */
export const WEBDAV_TIMEOUT = 10000;

/** 同步重试最大次数 */
export const SYNC_MAX_RETRIES = 3;

/** 同步重试间隔（5秒） */
export const SYNC_RETRY_DELAY = 5000;

/** 自动同步Alarm名称 */
export const AUTO_SYNC_ALARM_NAME = 'tabdav-auto-sync';

/** 存储键名 */
export const STORAGE_KEYS = {
  SETTINGS: 'user-settings',
  SYNC_METADATA: 'sync-metadata',
  LAST_SYNC_TIME: 'last-sync-time',
  PENDING_CHANGES: 'pending-changes',
} as const;

/** 消息类型 */
export const MESSAGE_TYPES = {
  // Tab操作
  TAB_ADD: 'tab/add',
  TAB_DELETE: 'tab/delete',
  TAB_UPDATE: 'tab/update',
  TAB_RESTORE: 'tab/restore',
  TAB_PERMANENT_DELETE: 'tab/permanent-delete',
  TAB_GET_ALL: 'tab/get-all',
  TAB_MOVE_TO_GROUP: 'tab/move-to-group',
  TAB_GET_BY_GROUP: 'tab/get-by-group',
  TAB_CLEANUP_INBOX: 'tab/cleanup-inbox', // 清理Inbox中超过7天的tabs
  TAB_CLEANUP_HISTORY: 'tab/cleanup-history', // 永久删除History中超过30天的tabs

  // 分组操作
  GROUP_CREATE: 'group/create',
  GROUP_DELETE: 'group/delete',
  GROUP_UPDATE: 'group/update',
  GROUP_GET_ALL: 'group/get-all',
  GROUP_ADD_TABS: 'group/add-tabs',

  // 同步操作
  SYNC_REQUEST: 'sync/request',
  SYNC_STATUS: 'sync/status',
  SYNC_COMPLETE: 'sync/complete',
  SYNC_ERROR: 'sync/error',
  SYNC_TEST: 'sync/test',

  // 数据导入导出
  DATA_EXPORT: 'data/export',
  DATA_IMPORT: 'data/import',
  DATA_CLEAR: 'data/clear', // 清除所有数据

  // 设置操作
  SETTINGS_GET: 'settings/get',
  SETTINGS_SAVE: 'settings/save',
  SETTINGS_RESET: 'settings/reset',
  SETTINGS_LANGUAGE_UPDATE: 'settings/language-update',

  // AI分类操作
  AI_CLASSIFY_CALL_LLM: 'ai/classify-call-llm',

  // 自定义规则操作
  RULE_AUTO_CLASSIFY: 'rule/auto-classify', // 应用规则自动分类

  // 统计操作
  STATS_GET: 'stats/get',

  // 页面信息
  GET_PAGE_INFO: 'page/info',
} as const;

/** 同步状态文本 */
export const SYNC_STATUS_TEXT = {
  idle: '已同步',
  syncing: '同步中...',
  error: '同步失败',
  offline: '离线',
} as const;

/** Toast持续时间（毫秒） */
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
} as const;

/** 动画时长（毫秒） */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;
