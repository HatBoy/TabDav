/**
 * Theme Service
 * Handles dynamic theme switching using CSS variables
 */

import type { ThemeColors } from './themeConfig';

const THEME_STORAGE_KEY = 'tabdav_theme';
const ROOT_ELEMENT = document.documentElement;

/**
 * Apply theme colors to CSS variables on the root element
 */
export function applyTheme(colors: ThemeColors): void {
  // Set each color shade as a CSS variable
  ROOT_ELEMENT.style.setProperty('--theme-primary-50', colors[50]);
  ROOT_ELEMENT.style.setProperty('--theme-primary-100', colors[100]);
  ROOT_ELEMENT.style.setProperty('--theme-primary-500', colors[500]);
  ROOT_ELEMENT.style.setProperty('--theme-primary-600', colors[600]);
  ROOT_ELEMENT.style.setProperty('--theme-primary-700', colors[700]);
}

/**
 * Save theme preference to Chrome storage
 */
export async function saveTheme(themeId: string): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [THEME_STORAGE_KEY]: themeId }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  // Fallback to localStorage for development
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}

/**
 * Load theme preference from Chrome storage
 */
export async function loadTheme(): Promise<string> {
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([THEME_STORAGE_KEY], (result) => {
        resolve(result[THEME_STORAGE_KEY] || 'blue');
      });
    });
  }
  // Fallback to localStorage for development
  return localStorage.getItem(THEME_STORAGE_KEY) || 'blue';
}

/**
 * Get current theme from Chrome storage (synchronous)
 */
export function getCurrentThemeSync(): string {
  // Try to get from localStorage for immediate access
  return localStorage.getItem(THEME_STORAGE_KEY) || 'blue';
}

/**
 * Listen for theme changes from other parts of the extension
 */
export function onThemeChange(callback: (themeId: string) => void): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync' && changes[THEME_STORAGE_KEY]) {
        callback(changes[THEME_STORAGE_KEY].newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
  // Fallback: listen for storage events
  const handler = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY && e.newValue) {
      callback(e.newValue);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
