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
