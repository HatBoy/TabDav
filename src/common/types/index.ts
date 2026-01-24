/**
 * 统一导出所有类型定义
 */

// Tab相关类型
export * from './tab';

// 分组相关类型
export * from './group';

// 同步相关类型
export * from './sync';

// 设置相关类型
export * from './settings';

/**
 * 通用API响应类型
 */
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
