/**
 * TabDav Background Script
 * Manifest V3 Service Worker
 */

import { MESSAGE_TYPES, AUTO_SYNC_ALARM_NAME } from '../common/constants';
import { tabService } from '../common/services/tabService';
import { groupService } from '../common/services/groupService';
import { settingsService } from '../common/services/settingsService';
import { syncEngine } from '../common/services/syncEngine';
import { dataIOService } from '../common/services/dataIOService';
import { autoSyncService } from '../common/services/autoSync';
import { t, initBackgroundI18n } from '../common/i18n/background';
import type { CreateTabInput, UpdateTabInput } from '../common/types/tab';
import type { CreateGroupInput, UpdateGroupInput } from '../common/types/group';

// ============ 常量定义 ============

const CONTEXT_MENU_PARENT = 'tabdav-parent';
const CONTEXT_MENU_COLLECT_CURRENT = 'tabdav-collect-current';
const CONTEXT_MENU_COLLECT_ALL = 'tabdav-collect-all';

// ============ 工具函数 ============

/**
 * 显示通知
 */
async function showNotification(title: string, message: string): Promise<void> {
  // 检查 notifications API 是否可用
  if (typeof chrome === 'undefined' || !chrome.notifications) {
    console.warn('chrome.notifications API 不可用');
    return;
  }

  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title,
      message,
    });
  } catch (error) {
    console.error('显示通知失败:', error);
  }
}

/**
 * 检查是否为排除的URL
 */
function isExcludedUrl(url: string): boolean {
  const excludedPatterns = [
    /^chrome:\/\//,
    /^about:/,
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^edge:\/\//,
  ];
  return excludedPatterns.some(pattern => pattern.test(url));
}

/**
 * 更新Badge显示
 * 状态A: 同步完成 (pending=0, error=0) → 隐藏角标
 * 状态B: 等待同步 (pending>0) → 显示数量，红色背景
 * 状态C: 同步错误 (error>0) → 显示 "!"，红色背景
 */
async function updateBadge(): Promise<void> {
  // 检查 chrome.action API 是否可用
  if (typeof chrome === 'undefined' || !chrome.action) {
    return;
  }

  try {
    // 检查是否显示未同步角标
    const settings = await settingsService.get();
    if (!settings.showUnsyncedBadge) {
      // 用户禁用了角标，强制清除
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    const stats = await tabService.getStats();

    // 状态C: 同步错误 - 最高优先级
    if (stats.error > 0) {
      await chrome.action.setBadgeText({ text: '!' });
      await chrome.action.setBadgeBackgroundColor({ color: '#B91C1C' }); // 深红色 - 白色字体
      return;
    }

    // 状态B: 等待同步
    if (stats.pending > 0) {
      await chrome.action.setBadgeText({ text: String(stats.pending) });
      await chrome.action.setBadgeBackgroundColor({ color: '#B91C1C' }); // 深红色 - 白色字体
      return;
    }

    // 状态A: 同步完成/空闲 - 隐藏角标
    await chrome.action.setBadgeText({ text: '' });
  } catch (error) {
    console.error('更新Badge失败:', error);
  }
}

/**
 * 收集单个标签页
 */
async function collectTab(tab: chrome.tabs.Tab): Promise<boolean> {
  if (!tab.url || !tab.title) {
    return false;
  }

  if (isExcludedUrl(tab.url)) {
    await showNotification(t('notifications.title'), t('notifications.cannotCollect'));
    return false;
  }

  const input: CreateTabInput = {
    url: tab.url,
    title: tab.title,
    favicon: tab.favIconUrl,
  };

  const result = await tabService.add(input);
  await updateBadge();

  if (result.isDuplicate) {
    await showNotification(t('notifications.title'), t('notifications.collectDuplicate'));
    return false;
  }

  // 收藏后关闭页面
  const settings = await settingsService.get();

  if (settings.closeAfterCollect && tab.id) {
    try {
      await chrome.tabs.remove(tab.id);
    } catch (e) {
      console.error('[TabDav] 关闭标签页失败:', e);
    }
  }

  return true;
}

// ============ 右键菜单 ============

// 标记右键菜单是否已初始化
let contextMenusInitialized = false;

/**
 * 安全创建右键菜单项（忽略重复错误）
 */
function safeCreateMenu(options: chrome.contextMenus.CreateProperties): void {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) {
    return;
  }
  try {
    chrome.contextMenus.create(options);
  } catch (e) {
    // 忽略重复 ID 错误，这些只是警告
    const error = e as Error;
    if (!error.message?.includes('duplicate')) {
      console.warn('创建菜单项失败:', options.id, error.message);
    }
  }
}

/**
 * 初始化右键菜单
 */
async function initContextMenus(): Promise<void> {
  // 防止重复初始化
  if (contextMenusInitialized) {
    return;
  }

  // 等待确保 API 可用
  await new Promise(resolve => setTimeout(resolve, 50));

  // 防御性检查
  if (typeof chrome === 'undefined' || typeof chrome.contextMenus === 'undefined') {
    return;
  }

  try {
    // 清除现有菜单
    await new Promise<void>(resolve => {
      try {
        chrome.contextMenus.removeAll(() => resolve());
      } catch {
        resolve();
      }
    });

    // 再次检查防止并发
    if (contextMenusInitialized) return;

    // 创建菜单（使用安全函数）
    safeCreateMenu({
      id: CONTEXT_MENU_PARENT,
      title: t('contextMenu.title'),
      contexts: ['page', 'selection'],
    });

    safeCreateMenu({
      id: CONTEXT_MENU_COLLECT_CURRENT,
      parentId: CONTEXT_MENU_PARENT,
      title: t('contextMenu.collectCurrent'),
      contexts: ['page'],
    });

    safeCreateMenu({
      id: CONTEXT_MENU_COLLECT_ALL,
      parentId: CONTEXT_MENU_PARENT,
      title: t('contextMenu.collectAll'),
      contexts: ['page'],
    });

    safeCreateMenu({
      id: 'tabdav-separator',
      parentId: CONTEXT_MENU_PARENT,
      type: 'separator',
      contexts: ['page'],
    });

    safeCreateMenu({
      id: 'tabdav-open',
      parentId: CONTEXT_MENU_PARENT,
      title: t('contextMenu.openSettings'),
      contexts: ['page'],
    });

    contextMenusInitialized = true;
  } catch (error) {
    console.error('初始化右键菜单失败:', error);
  }
}

/**
 * 处理右键菜单点击
 */
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  switch (info.menuItemId) {
    case CONTEXT_MENU_COLLECT_CURRENT:
      if (tab) {
        const success = await collectTab(tab);
        if (success) {
          await showNotification(
            t('notifications.title'),
            t('notifications.collected', { title: tab.title || '' })
          );
        }
      }
      break;

    case CONTEXT_MENU_COLLECT_ALL:
      if (tab?.windowId !== undefined) {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        let collected = 0;

        for (const t of tabs) {
          if (await collectTab(t)) {
            collected++;
          }
        }

        await showNotification(
          t('notifications.title'),
          t('notifications.collectedMultiple', { count: String(collected) })
        );
      }
      break;

    case 'tabdav-open':
      await chrome.runtime.openOptionsPage();
      break;
  }
}

// ============ 消息处理 ============

/**
 * 消息路由表
 */
const messageHandlers: Record<string, (payload: unknown) => Promise<unknown>> = {
  // Tab操作
  [MESSAGE_TYPES.TAB_ADD]: async (payload: unknown) => {
    const input = payload as CreateTabInput;
    const result = await tabService.add(input);
    await updateBadge();
    return { tab: result.tab, isDuplicate: result.isDuplicate };
  },

  [MESSAGE_TYPES.TAB_DELETE]: async (payload: unknown) => {
    const payloadData = payload as { id?: string; ids?: string[] };

    // 支持单个删除 (id) 和批量删除 (ids)
    if (payloadData.ids) {
      // 批量删除
      let allSuccess = true;
      for (const id of payloadData.ids) {
        const success = await tabService.delete(id);
        if (!success) {
          allSuccess = false;
        }
      }
      if (allSuccess) {
        await updateBadge();
      }
      return { success: allSuccess };
    } else if (payloadData.id) {
      // 单个删除
      const success = await tabService.delete(payloadData.id);
      if (success) {
        await updateBadge();
      }
      return { success };
    }

    return { success: false };
  },

  [MESSAGE_TYPES.TAB_UPDATE]: async (payload: unknown) => {
    const input = payload as UpdateTabInput;
    const tab = await tabService.update(input);
    return { success: !!tab, data: tab };
  },

  [MESSAGE_TYPES.TAB_RESTORE]: async (payload: unknown) => {
    const { url } = payload as { id: string; url: string; title: string };
    await chrome.tabs.create({ url, active: true });
    return { success: true };
  },

  [MESSAGE_TYPES.TAB_MOVE_TO_GROUP]: async (payload: unknown) => {
    const { tabIds, groupId } = payload as { tabIds: string[]; groupId?: string };

    // 规范化 groupId：空字符串转换为 undefined，表示"移出分组"
    const normalizedGroupId = groupId === '' ? undefined : groupId;

    // 使用 tabService 更新所有 tab 的 groupId
    for (const tabId of tabIds) {
      await tabService.update({
        id: tabId,
        groupId: normalizedGroupId,
      });
    }

    // 刷新所有分组的 tabCount，确保计数正确
    await groupService.refreshAllTabCounts();

    return { success: true };
  },

  [MESSAGE_TYPES.TAB_GET_ALL]: async () => {
    const tabs = await tabService.getAll();
    // 注意：不要在这里包装 {success: true, data: ...}，handleMessage 会自动包装
    return tabs;
  },

  [MESSAGE_TYPES.TAB_GET_BY_GROUP]: async (payload: unknown) => {
    const { groupId } = payload as { groupId?: string };
    if (groupId) {
      const tabs = await tabService.getByGroup(groupId);
      return { success: true, data: tabs };
    }
    const tabs = await tabService.getAll();
    return { success: true, data: tabs };
  },

  // 分组操作
  [MESSAGE_TYPES.GROUP_CREATE]: async (payload: unknown) => {
    const input = payload as CreateGroupInput;
    const group = await groupService.create(input);
    return group;
  },

  [MESSAGE_TYPES.GROUP_UPDATE]: async (payload: unknown) => {
    const input = payload as UpdateGroupInput;
    const group = await groupService.update(input);
    return group;
  },

  [MESSAGE_TYPES.GROUP_DELETE]: async (payload: unknown) => {
    const { id, deleteTabs } = payload as { id: string; deleteTabs?: boolean };
    const success = await groupService.delete(id, deleteTabs);
    return { success };
  },

  [MESSAGE_TYPES.GROUP_GET_ALL]: async () => {
    const groups = await groupService.getAll();
    // 注意：不要在这里包装 {success: true, data: ...}，handleMessage 会自动包装
    return groups;
  },

  [MESSAGE_TYPES.GROUP_ADD_TABS]: async (payload: unknown) => {
    const { tabIds, groupId } = payload as { tabIds: string[]; groupId: string };
    const db = await import('../common/utils/storage').then(m => m.getDB());

    // Use single transaction for tabs and groups to avoid race conditions
    const tx = db.transaction(['tabs', 'groups'], 'readwrite');

    // Update all tabs
    const tabStore = tx.objectStore('tabs');
    for (const tabId of tabIds) {
      const tab = await tabStore.get(tabId);
      if (tab) {
        tab.groupId = groupId;
        tab.updatedAt = Date.now();
        tab.syncStatus = 'pending';
        await tabStore.put(tab);
      }
    }

    // Update group tab count in the same transaction
    const groupStore = tx.objectStore('groups');
    const group = await groupStore.get(groupId);
    if (group) {
      // Query tabs with new groupId using tabStore directly (same transaction)
      const index = tabStore.index('by-group');
      const tabs = await index.getAll(groupId);
      group.tabCount = tabs.length;
      group.updatedAt = Date.now();
      await groupStore.put(group);
    }

    await tx.done;
    return { success: true };
  },

  // 统计操作
  [MESSAGE_TYPES.STATS_GET]: async () => {
    const stats = await tabService.getStats();
    const groupStats = await groupService.getStats();
    return { ...stats, groups: groupStats.groups };
  },

  // 设置操作
  [MESSAGE_TYPES.SETTINGS_GET]: async () => {
    const settings = await settingsService.get();
    return settings;
  },

  [MESSAGE_TYPES.SETTINGS_SAVE]: async (payload: unknown) => {
    const settings = payload as Parameters<typeof settingsService.save>[0];
    await settingsService.saveAndRestartSync(settings);
    return true;
  },

  [MESSAGE_TYPES.SETTINGS_RESET]: async () => {
    const settings = await settingsService.reset();
    return settings;
  },

  // 语言更新（用户切换语言时通知 Service Worker 更新）
  [MESSAGE_TYPES.SETTINGS_LANGUAGE_UPDATE]: async (payload: unknown) => {
    const { language } = payload as { language: string };
    await initBackgroundI18n(language);
    return { success: true };
  },

  // 同步测试
  [MESSAGE_TYPES.SYNC_TEST]: async () => {
    return syncEngine.testConnection();
  },

  // 同步请求
  [MESSAGE_TYPES.SYNC_REQUEST]: async () => {
    const result = await syncEngine.sync();
    // 同步完成后更新 Badge（显示总数）
    await updateBadge();
    return result;
  },

  // 数据导出
  [MESSAGE_TYPES.DATA_EXPORT]: async () => {
    return await dataIOService.exportAll();
  },

  // 数据导入
  [MESSAGE_TYPES.DATA_IMPORT]: async (payload: unknown) => {
    const data = payload as {
      version?: number;
      exportedAt?: number;
      tabs: Record<string, any>;
      groups: Record<string, any>;
    };
    const result = await dataIOService.importData({
      version: data.version || 1,
      exportedAt: data.exportedAt || Date.now(),
      tabs: data.tabs || {},
      groups: data.groups || {},
    });
    // 导入成功后更新 Badge
    await updateBadge();
    return result;
  },

  // 清除所有数据（只清除标签和分组，保留设置）
  [MESSAGE_TYPES.DATA_CLEAR]: async () => {
    // 停止自动同步
    await autoSyncService.stop();
    // 使用新的clearAllData方法（会删除tabs、groups和sync_snapshot）
    const result = await dataIOService.clearAllData();
    // 更新Badge
    await updateBadge();
    return result;
  },
};

/**
 * 处理消息
 */
async function handleMessage(message: {
  type: string;
  payload?: unknown;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const handler = messageHandlers[message.type];

  if (!handler) {
    console.error('[DEBUG handleMessage] 未找到处理器:', message.type);
    return { success: false, error: `Unknown message type: ${message.type}` };
  }

  try {
    const result = await handler(message.payload);
    return { success: true, data: result };
  } catch (error) {
    console.error(`[DEBUG handleMessage] 处理错误 ${message.type}:`, error);
    return { success: false, error: String(error) };
  }
}

// ============ 初始化 ============

/**
 * 初始化
 */
async function init(): Promise<void> {
  // 初始化 i18n - 读取用户的语言设置
  const language = await settingsService.getLanguage();
  await initBackgroundI18n(language);

  // 初始化右键菜单
  await initContextMenus();

  // 更新Badge
  await updateBadge();

  // 确保默认分组存在
  await groupService.getAll();

  // 启动自动同步
  const syncSettings = await settingsService.getSyncSettings();
  if (syncSettings.autoSyncEnabled) {
    await autoSyncService.start();
  }

  // 如果启动时同步启用，立即同步
  if (syncSettings.syncOnStartup) {
    setTimeout(async () => {
      try {
        await syncEngine.sync();
      } catch (error) {
        console.error('启动同步失败:', error);
      }
    }, 2000);
  }
}

// 启动
init();

// ============ 事件监听 ============

// 右键菜单点击（确保 API 可用）
if (typeof chrome !== 'undefined' && chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    handleContextMenuClick(info, tab);
  });
}

// 消息监听
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then(result => {
      sendResponse(result);
    })
    .catch(error => {
      console.error('[DEBUG onMessage] 处理错误:', message.type, error);
      sendResponse({ success: false, error: String(error) });
    });
  return true; // 异步响应
});

// 标签页更新时更新Badge
chrome.tabs.onUpdated.addListener(async () => {
  await updateBadge();
});

// 标签页移除时更新Badge
chrome.tabs.onRemoved.addListener(async () => {
  await updateBadge();
});

// 插件安装时初始化
chrome.runtime.onInstalled.addListener(async details => {
  if (details.reason === 'install') {
    await init();
  }
});

// 自动同步定时器
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === AUTO_SYNC_ALARM_NAME) {
    try {
      // 使用 autoSyncService 执行同步，它会检查是否启用和是否正在同步
      await autoSyncService.performSync();
      await updateBadge();
    } catch (error) {
      // 静默处理错误
    }
  }
});

// 快捷键处理
chrome.commands.onCommand.addListener(async command => {
  if (command === 'collect-current-tab') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      const success = await collectTab(tab);
      if (success) {
        await showNotification(
          t('notifications.title'),
          t('notifications.collected', { title: tab.title || '' })
        );
      }
    }
  } else if (command === 'collect-all-tabs') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId !== undefined) {
      const tabs = await chrome.tabs.query({ windowId: tab.windowId });
      let collected = 0;

      for (const t of tabs) {
        if (await collectTab(t)) {
          collected++;
        }
      }

      await showNotification(
        t('notifications.title'),
        t('notifications.collectedMultiple', { count: String(collected) })
      );
    }
  }
});

// 监听设置变化，当 showUnsyncedBadge 设置改变时更新 Badge
// 注意：由于设置存储在 IndexedDB 而非 chrome.storage，这里通过消息监听
// 当设置更新时会触发 updateBadge，所以不需要额外的监听器

// 导出供其他模块使用
export {};
