/**
 * 日期工具函数测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  formatRelativeTime,
  formatDate,
  formatDuration,
  getDomain,
  truncate
} from './date';

describe('date utils', () => {
  describe('formatRelativeTime', () => {
    it('should return "刚刚" for recent timestamps', () => {
      const now = Date.now();
      expect(formatRelativeTime(now)).toBe('刚刚');
      expect(formatRelativeTime(now - 30000)).toBe('刚刚'); // 30 seconds ago
    });

    it('should return minutes ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5分钟前');
      expect(formatRelativeTime(now - 59 * 60 * 1000)).toBe('59分钟前');
    });

    it('should return hours ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2小时前');
      expect(formatRelativeTime(now - 23 * 60 * 60 * 1000)).toBe('23小时前');
    });

    it('should return days ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000)).toBe('2天前');
      expect(formatRelativeTime(now - 6 * 24 * 60 * 60 * 1000)).toBe('6天前');
    });

    it('should return weeks ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 14 * 24 * 60 * 60 * 1000)).toBe('2周前');
    });

    it('should return months ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 60 * 24 * 60 * 60 * 1000)).toBe('2个月前');
    });

    it('should return years ago', () => {
      const now = Date.now();
      expect(formatRelativeTime(now - 365 * 24 * 60 * 60 * 1000)).toBe('1年前');
    });
  });

  describe('formatDate', () => {
    it('should format as date only', () => {
      const timestamp = new Date('2025-01-15T10:30:00').getTime();
      expect(formatDate(timestamp, 'date')).toBe('2025-01-15');
    });

    it('should format as datetime', () => {
      const timestamp = new Date('2025-01-15T10:30:00').getTime();
      expect(formatDate(timestamp, 'datetime')).toBe('2025-01-15 10:30');
    });

    it('should format as time only', () => {
      const timestamp = new Date('2025-01-15T10:30:45').getTime();
      expect(formatDate(timestamp, 'time')).toBe('10:30:45');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5秒');
      expect(formatDuration(30000)).toBe('30秒');
    });

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1分0秒');
      expect(formatDuration(90000)).toBe('1分30秒');
      // 3600000ms = 60 minutes = 1 hour
      expect(formatDuration(3600000)).toBe('1小时0分钟');
    });

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1小时0分钟');
      expect(formatDuration(3660000)).toBe('1小时1分钟');
      // 90000000ms = 25 hours = 1 day + 1 hour
      expect(formatDuration(90000000)).toBe('1天1小时');
    });

    it('should format days', () => {
      expect(formatDuration(172800000)).toBe('2天0小时');
    });
  });

  describe('getDomain', () => {
    it('should extract domain from URL', () => {
      expect(getDomain('https://example.com/path')).toBe('example.com');
      expect(getDomain('https://www.example.com/path')).toBe('example.com');
      expect(getDomain('http://sub.example.com/path')).toBe('sub.example.com');
    });

    it('should handle invalid URLs', () => {
      expect(getDomain('not-a-url')).toBe('not-a-url');
      expect(getDomain('')).toBe('');
    });

    it('should handle URLs with port', () => {
      expect(getDomain('https://example.com:8080/path')).toBe('example.com');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('should truncate long strings', () => {
      // suffix is included in maxLength calculation
      expect(truncate('hello world', 8)).toBe('hello...');
      expect(truncate('hello world', 5)).toBe('he...');
    });

    it('should use custom suffix', () => {
      expect(truncate('hello world', 8, '***')).toBe('hello***');
    });

    it('should handle edge cases', () => {
      expect(truncate('', 5)).toBe('');
      expect(truncate('test', 0)).toBe('');
    });
  });
});
