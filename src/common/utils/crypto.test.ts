/**
 * 工具函数测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateUUID,
  generateId,
  hashCode,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  sleep,
  encodeBase64,
  decodeBase64,
  xorEncrypt,
  xorDecrypt
} from './crypto';

describe('crypto utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('generateId', () => {
    it('should generate an id with timestamp', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    });
  });

  describe('hashCode', () => {
    it('should return consistent hash for same string', () => {
      const hash1 = hashCode('test');
      const hash2 = hashCode('test');
      expect(hash1).toBe(hash2);
    });

    it('should return different hash for different strings', () => {
      const hash1 = hashCode('test1');
      const hash2 = hashCode('test2');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string', () => {
      const hash = hashCode('');
      expect(typeof hash).toBe('number');
    });
  });

  describe('debounce', () => {
    it('should delay function execution', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);
      debouncedFn();
      expect(fn).not.toHaveBeenCalled();
      await sleep(150);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should only call once for multiple calls within delay', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);
      debouncedFn();
      debouncedFn();
      debouncedFn();
      await sleep(150);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should call function immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should not call again within limit', async () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);
      throttledFn();
      throttledFn();
      await sleep(50);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow call after limit', async () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);
      throttledFn();
      await sleep(150);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepClone', () => {
    it('should clone primitive values', () => {
      expect(deepClone(1)).toBe(1);
      expect(deepClone('test')).toBe('test');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    it('should clone arrays', () => {
      const original = [1, 2, 3];
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it('should clone nested objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      expect(cloned).toEqual(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should handle circular references', () => {
      const obj: Record<string, unknown> = { value: 1 };
      obj.self = obj;
      const cloned = deepClone(obj);
      expect((cloned as { value: number }).value).toBe(1);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty objects', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('should return false for non-empty objects', () => {
      expect(isEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('encodeBase64/decodeBase64', () => {
    it('should encode and decode strings', () => {
      const original = 'Hello, World! 你好';
      const encoded = encodeBase64(original);
      const decoded = decodeBase64(encoded);
      expect(decoded).toBe(original);
    });

    it('should handle special characters', () => {
      const original = '!@#$%^&*()_+-=[]{}|;\':",./<>?';
      const encoded = encodeBase64(original);
      const decoded = decodeBase64(encoded);
      expect(decoded).toBe(original);
    });
  });

  describe('xorEncrypt/xorDecrypt', () => {
    it('should encrypt and decrypt strings', () => {
      const original = 'secret data';
      const encrypted = xorEncrypt(original);
      const decrypted = xorDecrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should use custom key', () => {
      const original = 'secret';
      const key = 'mykey';
      const encrypted = xorEncrypt(original, key);
      const decrypted = xorDecrypt(encrypted, key);
      expect(decrypted).toBe(original);
    });

    it('should produce consistent encrypted strings', () => {
      const original = 'test';
      const encrypted1 = xorEncrypt(original);
      const encrypted2 = xorEncrypt(original);
      // XOR encryption with fixed key is deterministic
      expect(encrypted1).toBe(encrypted2);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });
});
