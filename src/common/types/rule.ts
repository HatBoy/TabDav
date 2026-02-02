/**
 * 自定义分类规则相关类型定义
 */

/**
 * 规则匹配类型
 */
export type RulePatternType = 'exact' | 'prefix' | 'domain' | 'regex';

/**
 * 自定义规则
 */
export interface CustomRule {
  /** 规则ID */
  id: string;
  /** 规则名称（用户可见） */
  name: string;
  /** URL匹配模式 */
  pattern: string;
  /** 匹配类型 */
  patternType: RulePatternType;
  /** 目标分组ID（null表示不分类/跳过） */
  targetGroupId: string | null;
  /** 优先级（数字越大越优先，默认100） */
  priority: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 创建规则输入
 */
export interface CreateRuleInput {
  name: string;
  pattern: string;
  patternType: RulePatternType;
  targetGroupId: string | null;
  priority?: number;
  enabled?: boolean;
}

/**
 * 更新规则输入
 */
export interface UpdateRuleInput {
  id: string;
  name?: string;
  pattern?: string;
  patternType?: RulePatternType;
  targetGroupId?: string | null;
  priority?: number;
  enabled?: boolean;
}
