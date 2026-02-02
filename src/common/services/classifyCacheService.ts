/**
 * AI分类缓存服务
 * 负责管理分类结果的本地缓存
 */

import { getDB } from '../utils/storage';
import { normalizeUrl, getCacheFingerprint } from '../utils/classifyCache';
import { ruleVersionService } from './ruleVersionService';
import type { ClassifyCacheItem } from '../types/cache';
import type { Group } from '../types/group';

/** 缓存有效期：30天（毫秒） */
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

/**
 * AI分类缓存服务类
 */
class ClassifyCacheService {
  /**
   * 生成缓存键
   */
  private async generateCacheKey(url: string, targetLists: Group[]): Promise<string> {
    const normalized = normalizeUrl(url);
    const rulesVersion = await ruleVersionService.getVersion();
    const cacheFingerprint = getCacheFingerprint(targetLists, rulesVersion);
    return `${normalized}::${cacheFingerprint}`;
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_TTL;
  }

  /**
   * 获取缓存
   * @returns 缓存的分组ID，undefined表示无缓存，null表示明确不分类
   */
  async get(url: string, targetLists: Group[]): Promise<string | null | undefined> {
    try {
      const cacheKey = await this.generateCacheKey(url, targetLists);

      const db = await getDB();
      const cache = await db.get('classifyCache', cacheKey);

      if (!cache) {
        return undefined; // 无缓存
      }

      // 检查是否过期
      if (this.isExpired(cache.timestamp)) {
        // 过期，删除并返回undefined
        await db.delete('classifyCache', cacheKey);
        return undefined;
      }

      // 更新命中次数
      cache.hitCount++;
      await db.put('classifyCache', cache);

      return cache.groupId;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 设置缓存
   */
  async set(url: string, targetLists: Group[], groupId: string | null): Promise<void> {
    try {
      const cacheKey = await this.generateCacheKey(url, targetLists);
      const normalizedUrl = normalizeUrl(url);
      const rulesVersion = await ruleVersionService.getVersion();
      const cacheFingerprint = getCacheFingerprint(targetLists, rulesVersion);

      const cacheItem: ClassifyCacheItem = {
        id: cacheKey,
        url,
        normalizedUrl,
        groupId,
        source: 'llm',
        listsFingerprint: cacheFingerprint, // 包含规则版本的指纹
        timestamp: Date.now(),
        hitCount: 0,
      };

      const db = await getDB();
      await db.put('classifyCache', cacheItem);
    } catch (error) {
      // Cache save failed silently
    }
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    try {
      const db = await getDB();
      await db.clear('classifyCache');
    } catch (error) {
      // Cache clear failed silently
    }
  }

  /**
   * 清除过期缓存
   * @returns 清除的条目数
   */
  async clearExpired(): Promise<number> {
    try {
      const db = await getDB();
      const tx = db.transaction('classifyCache', 'readwrite');
      const store = tx.objectStore('classifyCache');
      const allCaches = await store.getAll();

      let deletedCount = 0;
      for (const cache of allCaches) {
        if (this.isExpired(cache.timestamp)) {
          await store.delete(cache.id);
          deletedCount++;
        }
      }

      await tx.done;
      return deletedCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 清除旧版本的缓存
   * 清理那些规则版本号过旧的缓存项（可选，用于节省存储空间）
   * @returns 清除的条目数
   */
  async clearOldVersions(): Promise<number> {
    try {
      const currentVersion = await ruleVersionService.getVersion();
      const db = await getDB();
      const tx = db.transaction('classifyCache', 'readwrite');
      const store = tx.objectStore('classifyCache');
      const allCaches = await store.getAll();

      let deletedCount = 0;
      for (const cache of allCaches) {
        // 从缓存指纹中提取版本号
        const versionMatch = cache.listsFingerprint.match(/::v(\d+)$/);
        if (versionMatch) {
          const cacheVersion = parseInt(versionMatch[1], 10);
          // 如果缓存版本号小于当前版本号，说明是旧版本，可以删除
          if (cacheVersion < currentVersion) {
            await store.delete(cache.id);
            deletedCount++;
          }
        }
      }

      await tx.done;
      return deletedCount;
    } catch (error) {
      return 0;
    }
  }
}

// 导出单例
export const classifyCacheService = new ClassifyCacheService();
