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
import { customRuleService } from '../common/services/customRuleService';
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
    // Notification failed silently
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
    // Badge update failed silently
  }
}

/**
 * 收集单个标签页
 * @param tab 要收集的标签页
 * @param silent 静默模式，不显示错误通知（用于批量收藏）
 * @returns { success: boolean, autoClassified: boolean } 收藏是否成功，是否自动归类
 */
async function collectTab(tab: chrome.tabs.Tab, silent = false): Promise<{ success: boolean; autoClassified: boolean }> {
  if (!tab.url || !tab.title) {
    return { success: false, autoClassified: false };
  }

  if (isExcludedUrl(tab.url)) {
    if (!silent) {
      await showNotification(t('notifications.title'), t('notifications.cannotCollect'));
    }
    return { success: false, autoClassified: false };
  }

  const input: CreateTabInput = {
    url: tab.url,
    title: tab.title,
    favicon: tab.favIconUrl,
  };

  const result = await tabService.add(input);
  await updateBadge();

  if (result.isDuplicate) {
    if (!silent) {
      await showNotification(t('notifications.title'), t('notifications.collectDuplicate'));
    }
    return { success: false, autoClassified: false };
  }

  // 标记是否自动归类
  let autoClassified = false;

  // 自动应用规则分类（仅对新添加的tab）
  if (result.tab) {
    try {
      const groups = await groupService.getAll();
      const matchedGroupId = await customRuleService.match(result.tab.url, groups);

      if (matchedGroupId !== undefined && matchedGroupId !== null) {
        // 规则匹配成功，更新tab的groupId
        await tabService.update({
          id: result.tab.id,
          groupId: matchedGroupId,
        });
        autoClassified = true;
      }
    } catch (error) {
      // 不影响收藏流程，继续执行
    }
  }

  // 收藏后关闭页面
  const settings = await settingsService.get();

  if (settings.closeAfterCollect && tab.id) {
    try {
      await chrome.tabs.remove(tab.id);
    } catch (e) {
      // Tab close failed silently
    }
  }

  return { success: true, autoClassified };
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
    // Context menu initialization failed silently
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
        const result = await collectTab(tab);
        if (result.success) {
          const message = result.autoClassified
            ? t('notifications.collectedAndClassified', { title: tab.title || '' })
            : t('notifications.collected', { title: tab.title || '' });
          await showNotification(t('notifications.title'), message);
        }
      }
      break;

    case CONTEXT_MENU_COLLECT_ALL:
      if (tab?.windowId !== undefined) {
        const tabs = await chrome.tabs.query({ windowId: tab.windowId });
        let collected = 0;
        let autoClassified = 0;

        for (const t of tabs) {
          const result = await collectTab(t, true); // 使用静默模式
          if (result.success) {
            collected++;
            if (result.autoClassified) {
              autoClassified++;
            }
          }
        }

        const message = autoClassified > 0
          ? t('notifications.collectedMultipleAndClassified', { collected: String(collected), classified: String(autoClassified) })
          : t('notifications.collectedMultiple', { count: String(collected) });
        await showNotification(t('notifications.title'), message);
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

    // 标记是否自动归类
    let autoClassified = false;

    // 自动应用规则分类（仅对新添加的tab）
    if (result.tab && !result.isDuplicate) {
      try {
        const groups = await groupService.getAll();
        const matchedGroupId = await customRuleService.match(result.tab.url, groups);

        if (matchedGroupId !== undefined && matchedGroupId !== null) {
          // 规则匹配成功，更新tab的groupId
          await tabService.update({
            id: result.tab.id,
            groupId: matchedGroupId,
          });
          autoClassified = true;
        }
      } catch (error) {
        // 不影响添加流程，继续执行
      }
    }

    return { tab: result.tab, isDuplicate: result.isDuplicate, autoClassified };
  },

  [MESSAGE_TYPES.TAB_DELETE]: async (payload: unknown) => {
    const payloadData = payload as { id?: string; ids?: string[]; status?: 'completed' | 'deleted' };

    // 支持单个删除 (id) 和批量删除 (ids)
    if (payloadData.ids) {
      // 批量删除
      let allSuccess = true;
      for (const id of payloadData.ids) {
        const success = await tabService.delete(id, 'deleted');
        if (!success) {
          allSuccess = false;
        }
      }
      if (allSuccess) {
        await updateBadge();
      }
      return { success: allSuccess };
    } else if (payloadData.id) {
      // 单个删除（支持可选的status参数）
      const success = await tabService.delete(payloadData.id, payloadData.status);
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
    const { id } = payload as { id: string };
    const success = await tabService.restore(id);
    if (success) {
      await updateBadge();
    }
    return { success };
  },

  [MESSAGE_TYPES.TAB_PERMANENT_DELETE]: async (payload: unknown) => {
    const payloadData = payload as { id?: string; ids?: string[] };

    // 支持单个删除 (id) 和批量删除 (ids)
    if (payloadData.ids) {
      // 批量永久删除
      const count = await tabService.bulkPermanentDelete(payloadData.ids);
      if (count > 0) {
        await updateBadge();
      }
      return { success: true, count };
    } else if (payloadData.id) {
      // 单个永久删除
      const success = await tabService.permanentDelete(payloadData.id);
      if (success) {
        await updateBadge();
      }
      return { success };
    }

    return { success: false };
  },

  [MESSAGE_TYPES.TAB_MOVE_TO_GROUP]: async (payload: unknown) => {
    const { tabIds, groupId } = payload as { tabIds: string[]; groupId?: string };

    // 规范化 groupId：空字符串转换为 undefined，表示"移出分组"
    const normalizedGroupId = groupId === '' ? undefined : groupId;

    // 使用 tabService 更新所有 tab 的 groupId（会自动更新相关分组的tabCount）
    for (const tabId of tabIds) {
      await tabService.update({
        id: tabId,
        groupId: normalizedGroupId,
      });
    }

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

  [MESSAGE_TYPES.TAB_CLEANUP_INBOX]: async () => {
    // 清理Inbox中超过7天未处理的tabs
    const cleanedCount = await tabService.cleanupOldInboxTabs();
    if (cleanedCount > 0) {
      await updateBadge();
    }
    return { success: true, count: cleanedCount };
  },

  [MESSAGE_TYPES.TAB_CLEANUP_HISTORY]: async () => {
    // 永久删除History中超过30天的tabs
    const deletedCount = await tabService.cleanupOldHistoryTabs();
    if (deletedCount > 0) {
      await updateBadge();
    }
    return { success: true, count: deletedCount };
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

  // AI分类 - 调用LLM API
  [MESSAGE_TYPES.AI_CLASSIFY_CALL_LLM]: async (payload: unknown) => {
    const { apiUrl, apiKey, modelName, targetLists, sourceTabs } = payload as {
      apiUrl: string;
      apiKey: string;
      modelName: string;
      targetLists: Array<{ id: string; title: string; type: string }>;
      sourceTabs: Array<{ id: string; title: string; url: string }>;
    };

    const SYSTEM_PROMPT = `You are a tab classification AI for TabDav. Classify browser tabs into user-defined lists by analyzing URL patterns and titles.

# List Types
1. ACTION (type: 'action'): Interactive tasks - dashboards, editors, forms, admin panels
   URL signals: /edit, /create, /admin, /dashboard, /settings, /compose, /new, /cart, /issues, /pulls

2. BUFFER (type: 'buffer'): Reading/learning content - articles, videos, docs, tutorials
   URL signals: /blog, /article, /post, /docs, /wiki, /tutorial, /guide, /watch, /read

# Classification Priority
1. URL Pattern (highest): /edit → ACTION, /blog → BUFFER
2. Title Keywords: "Edit", "Dashboard" → ACTION; "How to", "Tutorial" → BUFFER
3. Topic Match: Match tab topic to list title (e.g., "React Tutorial" → "Frontend Learning")
4. Confidence: Only assign if ≥75% confident, else return null
5. Special URLs: chrome://, about:, blank pages → always null

# Output Rules
- Return ONLY a valid JSON array (no markdown, no code blocks, no explanation)
- Each tab gets exactly ONE groupId (from provided list IDs) or null
- Use exact list IDs from TargetLists, never invent new IDs

Example output:
[{"groupId":"list-1","tabUrl":"https://example.com/edit"},{"groupId":null,"tabUrl":"chrome://newtab"}]

Classify now.`;

    try {
      // 构建User Prompt
      const userPrompt = JSON.stringify({
        TargetLists: targetLists,
        SourceTabs: sourceTabs,
      });

      // 构建API URL
      let baseUrl = apiUrl.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      baseUrl = baseUrl.replace(/\/v1\/chat\/completions$/, '');
      const fullApiUrl = `${baseUrl}/v1/chat/completions`;

      // 创建AbortController用于超时控制
      // 动态超时：基础90秒 + 每个标签页额外3秒
      const baseTimeout = 90000; // 90秒基础超时
      const perTabTimeout = 3000; // 每个标签页额外3秒
      const dynamicTimeout = baseTimeout + (sourceTabs.length * perTabTimeout);
      const maxTimeout = 180000; // 最大180秒
      const finalTimeout = Math.min(dynamicTimeout, maxTimeout);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), finalTimeout);

      try {
        const response = await fetch(fullApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Connection': 'keep-alive',
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1, // 降低随机性，提高分类一致性
            max_tokens: 4096,
            top_p: 0.9, // 添加top_p提高输出质量
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();

          // 尝试解析错误响应为JSON
          let errorDetail = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            errorDetail = errorJson.error?.message || errorJson.message || errorText;
          } catch (e) {
            // 如果不是JSON，使用原始文本
          }

          throw new Error(`API返回错误 (${response.status}): ${errorDetail}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('API返回内容为空');
        }

        // 清理可能的markdown代码块标记
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // 解析JSON结果
        const result = JSON.parse(cleanContent);

        return { success: true, data: result };
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error(`请求超时（${finalTimeout / 1000}秒）。建议减少每批处理的标签页数量或检查网络连接。`);
        }

        // 检查是否是网络错误
        if (fetchError instanceof TypeError) {
          throw new Error(`网络请求失败: ${fetchError.message}. 请检查API URL是否正确，以及网络连接是否正常。`);
        }

        throw fetchError;
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },

  // 自定义规则 - 自动分类
  [MESSAGE_TYPES.RULE_AUTO_CLASSIFY]: async (payload: unknown) => {
    const { tabIds } = payload as { tabIds?: string[] };

    try {
      // 获取所有分组（作为目标列表）
      const groups = await groupService.getAll();

      // 获取要分类的tabs
      let tabs;
      if (tabIds && tabIds.length > 0) {
        // 指定了tabIds，只处理这些tabs
        const allTabs = await tabService.getAll();
        tabs = allTabs.filter(tab => tabIds.includes(tab.id));
      } else {
        // 未指定tabIds，处理所有inbox中的tabs
        const allTabs = await tabService.getAll();
        tabs = allTabs.filter(tab => !tab.groupId && !tab.deletedAt);
      }

      if (tabs.length === 0) {
        return { success: true, matched: 0, unmatched: 0, results: [] };
      }

      // 应用规则
      const result = await customRuleService.applyRulesToTabs(tabs, groups);

      // 更新tabs的groupId
      for (const item of result.results) {
        await tabService.update({
          id: item.tabId,
          groupId: item.groupId || undefined,
        });
      }

      // 更新Badge
      await updateBadge();

      return { success: true, ...result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
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
    return { success: false, error: `Unknown message type: ${message.type}` };
  }

  try {
    const result = await handler(message.payload);
    return { success: true, data: result };
  } catch (error) {
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
        // Startup sync failed silently
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
      const result = await collectTab(tab);
      if (result.success) {
        const message = result.autoClassified
          ? t('notifications.collectedAndClassified', { title: tab.title || '' })
          : t('notifications.collected', { title: tab.title || '' });
        await showNotification(t('notifications.title'), message);
      }
    }
  } else if (command === 'collect-all-tabs') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId !== undefined) {
      const tabs = await chrome.tabs.query({ windowId: tab.windowId });
      let collected = 0;
      let autoClassified = 0;

      for (const t of tabs) {
        const result = await collectTab(t, true); // 使用静默模式
        if (result.success) {
          collected++;
          if (result.autoClassified) {
            autoClassified++;
          }
        }
      }

      const message = autoClassified > 0
        ? t('notifications.collectedMultipleAndClassified', { collected: String(collected), classified: String(autoClassified) })
        : t('notifications.collectedMultiple', { count: String(collected) });
      await showNotification(t('notifications.title'), message);
    }
  }
});

// 监听设置变化，当 showUnsyncedBadge 设置改变时更新 Badge
// 注意：由于设置存储在 IndexedDB 而非 chrome.storage，这里通过消息监听
// 当设置更新时会触发 updateBadge，所以不需要额外的监听器

// 导出供其他模块使用
export {};
