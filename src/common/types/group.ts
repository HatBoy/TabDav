/**
 * 分组数据模型定义
 */

/**
 * 分组接口
 */
export interface Group {
  /** 唯一标识符 */
  id: string;
  /** 分组名称 */
  name: string;
  /** 分组颜色（可选） */
  color?: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 更新时间戳 */
  updatedAt: number;
  /** 包含的Tab数量（冗余字段，用于快速显示） */
  tabCount: number;
}

/**
 * 创建分组的输入参数
 */
export interface CreateGroupInput {
  name: string;
  color?: string;
}

/**
 * 更新分组的输入参数
 */
export interface UpdateGroupInput {
  id: string;
  name?: string;
  color?: string;
}

/**
 * 所有可选颜色列表（20种颜色，两排显示）
 */
export const GROUP_COLORS = [
  '#F44336', // 红
  '#E91E63', // 粉
  '#9C27B0', // 紫
  '#673AB7', // 深紫
  '#3F51B5', // 靛蓝
  '#2196F3', // 蓝
  '#03A9F4', // 浅蓝
  '#00BCD4', // 青色
  '#009688', // 青绿
  '#4CAF50', // 绿
  '#8BC34A', // 浅绿
  '#CDDC39', // 柠檬绿
  '#FFC107', // 琥珀色
  '#FF9800', // 橙色
  '#FF5722', // 深橙
  '#795548', // 棕色
  '#607D8B', // 蓝灰
  '#9E9E9E', // 灰
  '#FFEB3B', // 黄
  '#00E676', // 亮绿
];
