/**
 * 同步相关类型定义
 */

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  ERROR = 'error',
  OFFLINE = 'offline',
}

/**
 * 冲突解决策略 (已废弃 - 现在使用统一的双向同步)
 * @deprecated 不再使用，所有冲突都使用时间戳最新的版本
 */
export enum ConflictStrategy {
  LOCAL_FIRST = 'local',
  SERVER_FIRST = 'server',
  MANUAL = 'manual',
}

/**
 * 同步元数据
 */
export interface SyncMetadata {
  /** 主键（用于IndexedDB） */
  id: string;
  /** 最后同步时间戳 */
  lastSyncTime: number;
  /** 本地数据版本号 */
  localVersion: number;
  /** 服务器数据版本号（可选） */
  serverVersion?: number;
  /** 当前同步状态 */
  status: SyncStatus;
  /** 错误信息（可选） */
  errorMessage?: string;
  /** 待同步的变更数量 */
  pendingChanges: number;
  /** 上次同步时的URL列表（用于检测删除） */
  lastKnownUrls?: string[];
}

/** 同步元数据存储键 */
export const SYNC_METADATA_KEY = 'sync-metadata';

/**
 * 同步进度
 */
export interface SyncProgress {
  status: SyncStatus;
  /** 总体进度百分比 0-100 */
  progress: number;
  /** 当前操作描述 */
  currentAction: string;
  /** 已处理的Tab数量 */
  processedTabs: number;
  /** 总Tab数量 */
  totalTabs: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 同步结果
 */
export interface SyncResult {
  success: boolean;
  /** 上传的Tab数量 */
  uploaded: number;
  /** 下载的Tab数量 */
  downloaded: number;
  /** 冲突数量 */
  conflicts: number;
  /** 错误信息（可选） */
  error?: string;
  /** 同步时间戳 */
  timestamp: number;
}

/**
 * 导出数据结构（用于WebDav存储）
 */
export interface ExportData {
  /** 导出格式版本 */
  version: number;
  /** 导出时间 */
  exportedAt: number;
  /** 导出的Tab数据 */
  tabs: TabData[];
  /** 导出的分组数据 */
  groups: GroupData[];
  /** 同步元数据 */
  syncMetadata: SyncMetadata;
}

/**
 * 导出的Tab数据
 */
export interface TabData {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  groupId?: string;
  /** 删除/归档时间戳（为null表示未删除，有值表示已归档到History） */
  deletedAt?: number;
  /** 删除前的分组ID（用于恢复到原来的位置） */
  originalGroupId?: string;
  /** 进入Inbox的时间戳（用于清理机制计时） */
  inboxAt?: number;
  /** 是否被自动清理机制移到History（风吹来的） */
  cleanedByWind?: boolean;
  /** 完成状态（用于标记"已完成"或"已删除"，undefined表示未完成） */
  status?: 'completed' | 'deleted';
  createdAt: number;
  updatedAt: number;
  lastVisited?: number;
  note?: string;
  tags?: string[];
}

/**
 * 导出的分组数据
 */
export interface GroupData {
  id: string;
  name: string;
  color?: string;
  /** 列表类型（用于区分active list和buffer list） */
  listType?: 'action' | 'buffer';
  createdAt: number;
  updatedAt: number;
}
