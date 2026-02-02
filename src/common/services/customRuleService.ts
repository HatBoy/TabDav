/**
 * 自定义分类规则服务
 * 负责管理和匹配自定义分类规则
 */

import { getDB } from '../utils/storage';
import { ruleVersionService } from './ruleVersionService';
import type { CustomRule, CreateRuleInput, UpdateRuleInput } from '../types/rule';
import type { Group } from '../types/group';

/**
 * 自定义规则服务类
 */
class CustomRuleService {
  /**
   * 生成规则ID
   */
  private generateId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 标准化URL用于匹配
   * 保留协议、域名、路径，移除查询参数和hash
   */
  private normalizeUrlForMatch(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * 匹配单个模式
   */
  private matchPattern(url: string, pattern: string, patternType: string): boolean {
    const normalizedUrl = this.normalizeUrlForMatch(url);

    switch (patternType) {
      case 'exact':
        return normalizedUrl === pattern;

      case 'prefix':
        return normalizedUrl.startsWith(pattern);

      case 'domain':
        return this.matchDomain(normalizedUrl, pattern);

      case 'regex':
        try {
          return new RegExp(pattern).test(normalizedUrl);
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * 域名匹配（支持通配符）
   * 示例：
   * - github.com/star/issues 匹配 github.com/user/repo/issues (star表示通配符)
   * - star.medium.com 匹配 blog.medium.com (star表示通配符)
   */
  private matchDomain(url: string, pattern: string): boolean {
    try {
      const urlObj = new URL(url);
      const fullPath = urlObj.hostname + urlObj.pathname;

      // 将通配符模式转换为正则表达式
      // * 匹配任意字符（除了 /）
      // ** 匹配任意字符（包括 /）
      let regexPattern = pattern
        .replace(/\./g, '\\.') // 转义点号
        .replace(/\*\*/g, '___DOUBLE_STAR___') // 临时替换 **
        .replace(/\*/g, '[^/]+') // * 匹配非斜杠字符
        .replace(/___DOUBLE_STAR___/g, '.*'); // ** 匹配任意字符

      // 添加开始和结束锚点
      regexPattern = `^${regexPattern}$`;

      return new RegExp(regexPattern).test(fullPath);
    } catch {
      return false;
    }
  }

  /**
   * 匹配URL到规则
   * @returns 匹配的分组ID，null表示明确不分类，undefined表示无匹配规则
   */
  async match(url: string, targetLists: Group[]): Promise<string | null | undefined> {
    try {
      const db = await getDB();
      const allRules = await db.getAll('customRules');

      // 过滤启用的规则
      const enabledRules = allRules.filter(rule => rule.enabled);

      if (enabledRules.length === 0) {
        return undefined; // 无规则
      }

      // 按优先级排序（高到低）
      enabledRules.sort((a, b) => {
        // 首先按优先级数字排序
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // 优先级相同时，按匹配类型排序：exact > prefix > domain > regex
        const typeOrder = { exact: 4, prefix: 3, domain: 2, regex: 1 };
        const orderDiff = typeOrder[b.patternType] - typeOrder[a.patternType];
        if (orderDiff !== 0) {
          return orderDiff;
        }
        // 最后按创建时间排序（早创建的优先）
        return a.createdAt - b.createdAt;
      });

      // 遍历规则，找到第一个匹配的
      for (const rule of enabledRules) {
        if (this.matchPattern(url, rule.pattern, rule.patternType)) {
          // 验证目标分组是否存在
          if (rule.targetGroupId) {
            const groupExists = targetLists.some(g => g.id === rule.targetGroupId);
            if (!groupExists) {
              continue; // 分组不存在，尝试下一个规则
            }
          }

          return rule.targetGroupId;
        }
      }

      return undefined; // 无匹配规则
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 创建规则
   */
  async create(input: CreateRuleInput): Promise<CustomRule> {
    const now = Date.now();
    const rule: CustomRule = {
      id: this.generateId(),
      name: input.name,
      pattern: input.pattern,
      patternType: input.patternType,
      targetGroupId: input.targetGroupId,
      priority: input.priority ?? 100,
      enabled: input.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDB();
    await db.add('customRules', rule);

    // 递增规则版本号，使旧缓存失效
    await ruleVersionService.incrementVersion();

    return rule;
  }

  /**
   * 更新规则
   */
  async update(input: UpdateRuleInput): Promise<CustomRule | null> {
    try {
      const db = await getDB();
      const existing = await db.get('customRules', input.id);

      if (!existing) {
        return null;
      }

      const updated: CustomRule = {
        ...existing,
        ...input,
        updatedAt: Date.now(),
      };

      await db.put('customRules', updated);

      // 递增规则版本号，使旧缓存失效
      await ruleVersionService.incrementVersion();

      return updated;
    } catch (error) {
      return null;
    }
  }

  /**
   * 删除规则
   */
  async delete(id: string): Promise<boolean> {
    try {
      const db = await getDB();
      await db.delete('customRules', id);

      // 递增规则版本号，使旧缓存失效
      await ruleVersionService.incrementVersion();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取所有规则
   */
  async getAll(): Promise<CustomRule[]> {
    try {
      const db = await getDB();
      const rules = await db.getAll('customRules');

      // 按优先级排序返回
      return rules.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.createdAt - b.createdAt;
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * 获取单个规则
   */
  async getById(id: string): Promise<CustomRule | null> {
    try {
      const db = await getDB();
      const rule = await db.get('customRules', id);
      return rule || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 测试规则匹配
   * 用于UI中的规则测试功能
   */
  testMatch(url: string, pattern: string, patternType: string): boolean {
    return this.matchPattern(url, pattern, patternType);
  }

  /**
   * 批量应用规则到tabs
   * @param tabs 要处理的tabs列表
   * @param targetLists 目标分组列表
   * @returns 匹配结果统计
   */
  async applyRulesToTabs(
    tabs: Array<{ id: string; url: string; title: string }>,
    targetLists: Group[]
  ): Promise<{ matched: number; unmatched: number; results: Array<{ tabId: string; groupId: string | null }> }> {
    const results: Array<{ tabId: string; groupId: string | null }> = [];
    let matched = 0;
    let unmatched = 0;

    for (const tab of tabs) {
      const groupId = await this.match(tab.url, targetLists);
      if (groupId !== undefined) {
        // 规则匹配成功
        results.push({ tabId: tab.id, groupId });
        matched++;
      } else {
        // 无匹配规则
        unmatched++;
      }
    }

    return { matched, unmatched, results };
  }
}

// 导出单例
export const customRuleService = new CustomRuleService();
