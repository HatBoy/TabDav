/**
 * AI分类缓存工具函数
 */

import type { Group } from '../types/group';

/**
 * 标准化URL
 * 移除查询参数、hash、尾部斜杠，转小写
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // 1. 获取 hostname + pathname
    let normalized = urlObj.hostname + urlObj.pathname;
    // 2. 转小写
    normalized = normalized.toLowerCase();
    // 3. 移除尾部斜杠
    normalized = normalized.replace(/\/$/, '');
    return normalized;
  } catch {
    // URL解析失败，返回原始URL的小写形式
    return url.toLowerCase();
  }
}

/**
 * 计算分组列表指纹
 * 用于检测分组列表是否发生变化
 */
export function getListsFingerprint(groups: Group[]): string {
  // 按ID排序后拼接，确保顺序一致
  const sortedIds = groups.map(g => g.id).sort();
  return sortedIds.join(',');
}

/**
 * 生成缓存指纹
 * 包含分组列表和规则版本，确保规则变化时缓存失效
 */
export function getCacheFingerprint(groups: Group[], rulesVersion: number): string {
  const listsFingerprint = getListsFingerprint(groups);
  return `${listsFingerprint}::v${rulesVersion}`;
}
