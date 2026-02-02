/**
 * 规则版本管理服务
 * 负责管理自定义规则的版本号，用于缓存失效机制
 */

const RULE_VERSION_KEY = 'custom-rules-version';

/**
 * 规则版本服务类
 */
class RuleVersionService {
  /**
   * 获取当前规则版本号
   */
  async getVersion(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(RULE_VERSION_KEY);
      return result[RULE_VERSION_KEY] || 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * 递增规则版本号
   * 当规则发生变化时调用（增删改）
   */
  async incrementVersion(): Promise<number> {
    try {
      const currentVersion = await this.getVersion();
      const newVersion = currentVersion + 1;
      await chrome.storage.local.set({ [RULE_VERSION_KEY]: newVersion });
      return newVersion;
    } catch (error) {
      return 1;
    }
  }

  /**
   * 重置版本号（仅用于测试或初始化）
   */
  async resetVersion(): Promise<void> {
    try {
      await chrome.storage.local.set({ [RULE_VERSION_KEY]: 1 });
    } catch (error) {
      // Reset failed silently
    }
  }
}

// 导出单例
export const ruleVersionService = new RuleVersionService();
