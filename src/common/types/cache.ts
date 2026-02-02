/**
 * AI分类缓存相关类型定义
 */

/**
 * 分类缓存项
 */
export interface ClassifyCacheItem {
  /** 缓存ID (cacheKey) */
  id: string;
  /** 原始URL */
  url: string;
  /** 标准化后的URL */
  normalizedUrl: string;
  /** 分类结果（分组ID或null） */
  groupId: string | null;
  /** 缓存来源 */
  source: 'llm';
  /** 分组列表指纹 */
  listsFingerprint: string;
  /** 缓存时间戳 */
  timestamp: number;
  /** 命中次数（统计用） */
  hitCount: number;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  /** 总缓存条目数 */
  total: number;
  /** 过期条目数 */
  expired: number;
  /** 总命中次数 */
  totalHits: number;
  /** 缓存大小（字节） */
  sizeBytes: number;
}
