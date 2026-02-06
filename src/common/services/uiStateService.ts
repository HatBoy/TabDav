/**
 * UI状态管理服务
 * 负责持久化popup的UI状态（当前视图和选中的分组）
 */

import { ViewType } from '../types/group';

const UI_STATE_KEY = 'popup-ui-state';

/**
 * UI状态接口
 */
export interface UIState {
  /** 上次选择的视图 */
  lastView: ViewType;
  /** 上次选择的分组ID（仅在Lists视图时有效） */
  lastGroupId?: string;
}

/**
 * UI状态服务类
 */
class UIStateService {
  /**
   * 获取保存的UI状态
   * @returns 返回保存的状态，如果不存在或读取失败则返回默认值（Inbox视图）
   */
  async getState(): Promise<UIState> {
    try {
      const result = await chrome.storage.local.get(UI_STATE_KEY);
      if (result[UI_STATE_KEY]) {
        return result[UI_STATE_KEY] as UIState;
      }
      // 返回默认状态
      return { lastView: ViewType.INBOX };
    } catch (error) {
      // 读取失败，返回默认状态
      return { lastView: ViewType.INBOX };
    }
  }

  /**
   * 保存UI状态
   * @param state 要保存的状态
   */
  async saveState(state: UIState): Promise<void> {
    try {
      await chrome.storage.local.set({ [UI_STATE_KEY]: state });
    } catch (error) {
      // 保存失败，静默处理（非关键功能）
    }
  }

  /**
   * 清除保存的UI状态
   * 用于测试或重置
   */
  async clearState(): Promise<void> {
    try {
      await chrome.storage.local.remove(UI_STATE_KEY);
    } catch (error) {
      // 清除失败，静默处理
    }
  }
}

// 导出单例
export const uiStateService = new UIStateService();
