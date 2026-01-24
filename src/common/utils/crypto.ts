/**
 * 加密工具函数
 * 用于安全存储敏感信息如密码
 */

/**
 * 使用Base64编码（Service Worker 兼容版本）
 */
export function encodeBase64(str: string): string {
  // 使用 TextEncoder 兼容 Service Worker 环境
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64解码（Service Worker 兼容版本）
 */
export function decodeBase64(str: string): string {
  try {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch {
    return '';
  }
}

/**
 * 简单的XOR加密（比Base64稍好，可逆）
 */
export function xorEncrypt(text: string, key: string = 'TabDav2024'): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return encodeBase64(result);
}

/**
 * XOR解密
 */
export function xorDecrypt(encrypted: string, key: string = 'TabDav2024'): string {
  try {
    const decoded = decodeBase64(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成唯一ID（基于时间戳和随机数）
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * 计算字符串哈希值（简单实现）
 */
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * 比较两个版本号
 * @returns -1: a < b, 0: a = b, 1: a > b
 */
export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aNum = aParts[i] || 0;
    const bNum = bParts[i] || 0;
    if (aNum !== bNum) {
      return aNum > bNum ? 1 : -1;
    }
  }
  return 0;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 深度克隆对象
 * 使用 WeakMap 追踪已克隆对象以处理循环引用
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const visited = new WeakMap<object, unknown>();

  function cloneInternal<T>(item: T): T {
    if (item === null || typeof item !== 'object') {
      return item;
    }

    if (visited.has(item)) {
      return visited.get(item) as T;
    }

    if (item instanceof Date) {
      return new Date(item.getTime()) as T;
    }

    if (item instanceof Array) {
      const cloned = item.map(el => cloneInternal(el));
      visited.set(item, cloned);
      return cloned as T;
    }

    if (item instanceof Set) {
      const cloned = new Set();
      visited.set(item, cloned);
      item.forEach(el => cloned.add(cloneInternal(el)));
      return cloned as T;
    }

    if (item instanceof Map) {
      const cloned = new Map();
      visited.set(item, cloned);
      item.forEach((val, key) => cloned.set(key, cloneInternal(val)));
      return cloned as T;
    }

    // Plain object
    const cloned: Record<string, unknown> = {};
    visited.set(item, cloned);
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        cloned[key] = cloneInternal((item as Record<string, unknown>)[key]);
      }
    }

    return cloned as T;
  }

  return cloneInternal(obj);
}

/**
 * 检查对象是否为空
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
