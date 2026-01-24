/**
 * 日期格式化工具
 */

/**
 * 日期格式化工具
 */

/**
 * 格式化时间戳为相对时间字符串（支持i18n）
 * @param timestamp 时间戳
 * @param t 翻译函数，如果提供则使用i18n翻译
 */
export function formatRelativeTime(
  timestamp: number,
  t?: (key: string, params?: Record<string, string | number>) => string
): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return t ? t('time.justNow') : '刚刚';
  } else if (minutes < 60) {
    return t ? t('time.minutesAgo', { count: minutes }) : `${minutes}分钟前`;
  } else if (hours < 24) {
    return t ? t('time.hoursAgo', { count: hours }) : `${hours}小时前`;
  } else if (days < 7) {
    return t ? t('time.daysAgo', { count: days }) : `${days}天前`;
  } else if (weeks < 4) {
    return t ? t('time.weeksAgo', { count: weeks }) : `${weeks}周前`;
  } else if (months < 12) {
    return t ? t('time.monthsAgo', { count: months }) : `${months}个月前`;
  } else {
    return t ? t('time.yearsAgo', { count: years }) : `${years}年前`;
  }
}

/**
 * 格式化时间戳为日期字符串
 */
export function formatDate(
  timestamp: number,
  format: 'date' | 'datetime' | 'time' = 'date'
): string {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  switch (format) {
    case 'date':
      return `${year}-${month}-${day}`;
    case 'time':
      return `${hours}:${minutes}:${seconds}`;
    case 'datetime':
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

/**
 * 格式化时间间隔为字符串
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天${hours % 24}小时`;
  } else if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
}

/**
 * 获取今天的开始时间戳
 */
export function getTodayStart(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

/**
 * 获取本周的开始时间戳
 */
export function getWeekStart(): number {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  now.setDate(diff);
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

/**
 * 解析URL获取域名
 */
export function getDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * 截断字符串
 * suffix 包含在 maxLength 计算中
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (maxLength <= 0) {
    return '';
  }
  if (str.length <= maxLength) {
    return str;
  }
  // 截断到 maxLength - suffix.length，然后添加后缀
  const availableLength = Math.max(0, maxLength - suffix.length);
  return str.substring(0, availableLength) + suffix;
}
