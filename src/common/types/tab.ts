/**
 * Tab数据模型定义
 */

/**
 * Tab项目接口
 */
export interface TabItem {
  /** 唯一标识符 */
  id: string;
  /** 页面URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** Favicon DataURL */
  favicon?: string;
  /** 所属分组ID */
  groupId?: string;
  /** 删除/归档时间戳（为null表示未删除，有值表示已归档到History） */
  deletedAt?: number;
  /** 删除前的分组ID（用于恢复到原来的位置） */
  originalGroupId?: string;
  /** 完成状态（用于标记"已完成"或"已删除"，undefined表示未完成） */
  status?: 'completed' | 'deleted';
  /** 进入Inbox的时间戳（用于清理机制计时） */
  inboxAt?: number;
  /** 是否被自动清理机制移到History（风吹来的） */
  cleanedByWind?: boolean;
  /** 收藏时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
  /** 最后访问时间戳（可选） */
  lastVisited?: number;
  /** 用户备注（可选） */
  note?: string;
  /** 标签数组（可选） */
  tags?: string[];
  /** 同步状态 */
  syncStatus: 'synced' | 'pending' | 'error';
  /** 同步错误信息（可选） */
  syncError?: string;
}

/**
 * 创建Tab的输入参数
 */
export interface CreateTabInput {
  url: string;
  title: string;
  favicon?: string;
  groupId?: string;
  note?: string;
  tags?: string[];
}

/**
 * 更新Tab的输入参数
 */
export interface UpdateTabInput {
  id: string;
  url?: string;
  title?: string;
  favicon?: string;
  groupId?: string;
  note?: string;
  tags?: string[];
}

/**
 * Tab搜索过滤条件
 */
export interface TabSearchFilters {
  query?: string;
  groupId?: string;
  tags?: string[];
  syncStatus?: 'synced' | 'pending' | 'error';
  sortBy?: 'createdAt' | 'title' | 'lastVisited';
  sortOrder?: 'asc' | 'desc';
  /** 是否包含已删除的Tab（默认false，即排除已归档到History的Tab） */
  includeDeleted?: boolean;
}

/**
 * Tab统计信息
 */
export interface TabStats {
  total: number;
  synced: number;
  pending: number;
  error: number;
  byGroup: Record<string, number>;
}
