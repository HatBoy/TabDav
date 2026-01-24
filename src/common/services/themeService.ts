/**
 * 主题管理服务
 */

import { settingsService } from './settingsService';
import type { ThemeMode } from '../types/settings';

/**
 * 主题管理类
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeMode = 'system';
  private mediaQuery: MediaQueryList | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * 初始化主题
   */
  async init(): Promise<void> {
    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => this.applyTheme());
    }

    // 加载用户设置的主题
    const theme = await settingsService.getTheme();
    await this.setTheme(theme);
  }

  /**
   * 设置主题
   */
  async setTheme(theme: ThemeMode): Promise<void> {
    this.currentTheme = theme;
    await settingsService.setTheme(theme);
    this.applyTheme();
  }

  /**
   * 获取当前主题
   */
  getTheme(): ThemeMode {
    return this.currentTheme;
  }

  /**
   * 应用主题到DOM
   */
  applyTheme(): void {
    if (typeof document === 'undefined') return;

    const isDark = this.isDarkMode();
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  /**
   * 判断是否为暗色模式
   */
  isDarkMode(): boolean {
    if (this.currentTheme === 'system') {
      return this.mediaQuery?.matches ?? false;
    }
    return this.currentTheme === 'dark';
  }

  /**
   * 切换主题
   */
  async toggleTheme(): Promise<void> {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    await this.setTheme(nextTheme);
  }

  /**
   * 获取主题图标
   */
  getThemeIcon(): string {
    if (this.currentTheme === 'dark') {
      return 'sun';
    } else if (this.currentTheme === 'light') {
      return 'moon';
    }
    return 'system';
  }
}

// 导出单例
export const themeManager = ThemeManager.getInstance();
