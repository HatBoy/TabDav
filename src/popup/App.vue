<template>
  <div v-if="!loaded" style="padding: 20px; text-align: center; color: #666">
    {{ $t('common.loading') }}
  </div>
  <div v-else class="app-container" :data-theme="theme">
    <!-- 头部 -->
    <header class="app-header">
      <div class="header-left">
        <!-- Brand Logo Icon -->
        <div class="brand-logo-mini">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <h1 class="app-title">TabDav</h1>
      </div>
      <div class="header-right">
        <!-- 同步按钮 -->
        <button
          class="header-btn sync-btn"
          :class="{ syncing: isSyncing }"
          @click="manualSync"
          :title="isSyncing ? $t('popup.syncTooltipSyncing') : $t('popup.syncTooltip')"
          :disabled="isSyncing"
        >
          <svg
            v-if="!isSyncing"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <svg
            v-else
            class="spinning"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <!-- 待同步数量角标 -->
          <span v-if="showBadge" class="sync-badge-dot">{{ stats.pending }}</span>
        </button>
        <!-- 批量管理按钮 -->
        <button
          v-if="mode === 'normal'"
          class="header-btn"
          @click="enterSelectMode"
          :title="$t('popup.batchManage')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </button>
        <!-- 设置按钮 -->
        <button class="header-btn" @click="openSettingsPage" :title="$t('common.settings')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </button>
      </div>
    </header>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <svg
        class="search-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :placeholder="$t('popup.searchPlaceholder')"
        :disabled="mode === 'select'"
      />
    </div>

    <!-- 统一的工具栏：视图控制器 + 子导航（单行布局） -->
    <div class="unified-toolbar">
      <!-- 左侧：视图选择器 + 添加按钮 -->
      <div class="toolbar-left">
        <ViewSelector v-model="currentView" />
        <!-- "+" 按钮 - 仅在 Lists 视图显示 -->
        <button
          v-if="currentView === 'lists'"
          class="add-list-btn"
          @click="showCreateGroup = true"
          :title="$t('popup.group.create')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <!-- 右侧：Inbox视图的数量徽章 或 Lists视图的分组标签 -->
      <div v-if="currentView === 'inbox'" class="toolbar-right">
        <div class="toolbar-divider"></div>
        <!-- Inbox Count Badge -->
        <div
          class="inbox-count-badge"
          :class="{
            'is-empty': inboxTabCount === 0,
            'is-normal': inboxTabCount > 0 && inboxTabCount <= 20,
            'is-warning': inboxTabCount > 20
          }"
        >
          <template v-if="inboxTabCount === 0">
            <!-- Empty state: green checkmark -->
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </template>
          <template v-else>
            <span class="badge-count">{{ inboxTabCount }}</span>
          </template>
        </div>
      </div>

      <div v-else-if="currentView === 'lists'" class="toolbar-right">
        <div class="toolbar-divider"></div>
        <div class="group-tabs-inline">
          <template v-if="groups.length > 0">
            <template v-for="(group, index) in groups" :key="group.id">
              <div v-if="index > 0" class="group-tab-divider"></div>
              <button
                :class="['group-tab-inline', { active: selectedGroupId === group.id }]"
                @click="selectedGroupId = group.id"
              >
                <span
                  class="group-dot-inline"
                  :style="{ backgroundColor: getGroupDotColor(group) }"
                ></span>
                <span class="group-name">{{ group.name }}</span>
                <span class="tab-count">({{ groupTabCounts[group.id] || 0 }})</span>
                <button
                  class="group-delete-btn-inline"
                  @click.stop="confirmDeleteGroup(group)"
                  :title="$t('popup.group.delete')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </button>
            </template>
          </template>
        </div>
      </div>

      <!-- History视图：一键清空按钮 -->
      <div v-else-if="currentView === 'history'" class="toolbar-right">
        <div class="toolbar-divider"></div>
        <button class="clear-history-btn" @click="confirmClearHistory" :title="$t('popup.history.clearAll')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="14" y2="11" />
            <line x1="10" y1="15" x2="14" y2="15" />
          </svg>
          <span>{{ $t('popup.history.clearAll') }}</span>
        </button>
      </div>
    </div>

    <!-- Tab列表 -->
    <div class="tab-list">
      <div v-if="filteredTabs.length === 0" class="empty-state">
        <svg
          class="empty-illustration"
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.5 6C3.5 4.89543 4.39543 4 5.5 4H18.5C19.6046 4 20.5 4.89543 20.5 6V8H3.5V6ZM3.5 10V18C3.5 19.1046 4.39543 20 5.5 20H18.5C19.6046 20 20.5 19.1046 20.5 18V10H3.5ZM5.5 2C3.29086 2 1.5 3.79086 1.5 6V18C1.5 20.2091 3.29086 22 5.5 22H18.5C20.7091 22 22.5 20.2091 22.5 18V6C22.5 3.79086 20.7091 2 18.5 2H5.5ZM9 14C8.44772 14 8 13.5523 8 13C8 12.4477 8.44772 12 9 12H15C15.5523 12 16 12.4477 16 13C16 13.5523 15.5523 14 15 14H9Z"
            fill-opacity="0.5"
          />
        </svg>
        <p class="empty-title">{{ getEmptyTitle() }}</p>
        <p class="empty-subtitle">{{ getEmptySubtitle() }}</p>
      </div>

      <div
        v-for="tab in filteredTabs"
        :key="tab.id"
        :data-tab-id="tab.id"
        :class="['tab-item', { selected: selectedTabIds.includes(tab.id) }]"
        @click="handleTabClick(tab)"
      >
        <!-- Favicon -->
        <img
          v-if="tab.favicon"
          :src="tab.favicon"
          class="tab-favicon"
          @error="handleFaviconError"
        />
        <div v-else class="tab-favicon-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path
              d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
            />
          </svg>
        </div>
        <!-- 内容区域 -->
        <div class="tab-content">
          <!-- 第一行：标题 -->
          <span class="tab-title">{{ tab.title }}</span>
          <!-- 第二行：域名 + 分组 + 时间 -->
          <div class="tab-meta-row">
            <span class="tab-url">{{ formatUrl(tab.url) }}</span>
            <!-- 在Lists视图（待办清单/待阅清单）中不显示分组信息，因为已经在分组中了 -->
            <!-- 在Inbox视图中不显示分组信息，因为Inbox中的tab没有分组 -->
            <!-- 在History视图中显示原始分组信息 -->
            <template v-if="currentView === ViewType.HISTORY && tab.originalGroupId">
              <span class="meta-separator">·</span>
              <span v-for="group in groups" :key="group.id">
                <span v-if="group.id === tab.originalGroupId" class="tab-group-info">
                  <span
                    class="group-dot"
                    :style="{ backgroundColor: getGroupDotColor(group) }"
                  ></span>
                  <span class="group-name">{{ group.name }}</span>
                </span>
              </span>
            </template>
            <template v-else-if="currentView === ViewType.HISTORY && !tab.originalGroupId">
              <!-- 从Inbox删除的tab，显示灰色圆点+Inbox -->
              <span class="meta-separator">·</span>
              <span class="tab-group-info">
                <span class="group-dot" style="background-color: #9ca3af"></span>
                <span class="group-name">Inbox</span>
              </span>
            </template>
            <span class="meta-separator">·</span>
            <span class="tab-time">{{ formatTime(tab.createdAt) }}</span>
            <!-- 同步状态图标 - pending: 灰色云朵 + 呼吸动画, error: 红色感叹号 -->
            <span
              v-if="tab.syncStatus === 'pending'"
              class="sync-status-icon pending animate-pulse ml-2"
              :title="$t('popup.tab.pending')"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path
                  d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
                />
              </svg>
            </span>
            <span
              v-else-if="tab.syncStatus === 'error'"
              class="sync-status-icon error ml-2"
              :title="$t('popup.tab.syncError')"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
            </span>
            <!-- Inbox清理机制图标 -->
            <template v-if="currentView === ViewType.INBOX">
              <!-- 绿色叶子：<3天 -->
              <span
                v-if="getInboxDays(tab) < 3"
                class="leaf-icon green-leaf ml-2"
                title="新收藏"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"/>
                </svg>
              </span>
              <!-- 黄色枯萎叶子：3-7天 -->
              <span
                v-else-if="getInboxDays(tab) < 7"
                class="leaf-icon yellow-leaf ml-2"
                title="需要处理"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"/>
                </svg>
              </span>
            </template>
            <!-- History风吹图标 -->
            <span
              v-if="currentView === ViewType.HISTORY && tab.cleanedByWind"
              class="wind-icon ml-2"
              title="自动清理"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
              </svg>
            </span>
          </div>
        </div>
        <!-- 操作按钮（悬停显示） -->
        <div v-if="mode === 'normal'" class="tab-actions">
          <!-- History视图：显示恢复和永久删除按钮 -->
          <template v-if="currentView === ViewType.HISTORY">
            <!-- 恢复按钮 -->
            <button
              class="tab-action-btn success"
              :title="$t('popup.history.restore')"
              @click.stop="restoreTab(tab.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <!-- 永久删除按钮 -->
            <button
              class="tab-action-btn danger"
              :title="$t('popup.history.permanentDelete')"
              @click.stop="permanentDeleteTab(tab.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path
                  d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M3 6l2 2M17 6l-2 2M10 11v6M14 11v6"
                />
              </svg>
            </button>
          </template>
          <!-- 非History视图：显示复制、移动到分组和删除按钮 -->
          <template v-else>
            <!-- 复制按钮 - 只在buffer list中显示 -->
            <button
              v-if="currentView === ViewType.LISTS && currentGroup?.listType === ListType.BUFFER"
              class="tab-action-btn"
              :title="$t('popup.tab.copyAsMarkdown')"
              @click.stop="copyTabAsMarkdown(tab)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <!-- 分组下拉菜单 -->
            <div class="tab-action-dropdown">
              <button
                class="tab-action-btn"
                :class="{ disabled: groups.length === 0 }"
                :title="tab.groupId ? $t('popup.tab.removeFromGroup') : $t('popup.tab.moveToGroup')"
                @click.stop="groups.length > 0 && toggleTabGroupDropdown(tab.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
                  />
                  <polyline points="11 12 15 16 19 12" />
                </svg>
              </button>
              <div
                v-if="activeTabGroupDropdown === tab.id && groups.length > 0"
                class="tab-group-dropdown-menu"
              >
                <button
                  v-for="group in groups"
                  :key="group.id"
                  :class="['dropdown-item', { active: tab.groupId === group.id }]"
                  @click.stop="moveTabToGroup(tab.id, group.id)"
                >
                  <!-- 待办清单：显示对号图标 -->
                  <svg
                    v-if="group.listType === ListType.ACTION"
                    class="dropdown-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <!-- 待阅清单���显示书籍图标 -->
                  <svg
                    v-else-if="group.listType === ListType.BUFFER"
                    class="dropdown-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  <!-- 其他情况（兜底）：显示原色点 -->
                  <span
                    v-else-if="group.color"
                    class="dropdown-color-dot"
                    :style="{ backgroundColor: group.color }"
                  ></span>
                  <span class="dropdown-item-text">{{ group.name }}</span>
                </button>
                <button
                  v-if="tab.groupId"
                  class="dropdown-item"
                  @click.stop="moveTabToGroup(tab.id, undefined)"
                >
                  <span class="dropdown-color-dot bg-gray-400"></span>
                  <span class="dropdown-item-text">{{ $t('popup.tab.removeFromGroup') }}</span>
                </button>
              </div>
            </div>
            <!-- 删除按钮 -->
            <button
              class="tab-action-btn danger"
              :title="$t('common.delete')"
              @click.stop="deleteTab(tab.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6" />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                />
              </svg>
            </button>
          </template>
        </div>
        <!-- 批量选择模式 -->
        <input
          v-if="mode === 'select'"
          type="checkbox"
          :checked="selectedTabIds.includes(tab.id)"
          class="tab-checkbox"
          @click.stop="toggleSelect(tab.id)"
        />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <footer v-if="mode === 'normal'" class="app-footer">
      <button class="footer-btn primary large" @click="collectCurrentTab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {{ $t('popup.collectCurrent') }}
      </button>
      <button class="footer-btn secondary" @click="collectAllTabs">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        {{ $t('popup.collectAll') }}
      </button>
    </footer>

    <!-- 选择模式底部栏 -->
    <footer v-if="mode === 'select'" class="action-bar">
      <!-- 左侧：选择控制区 -->
      <div class="action-bar-left">
        <span class="select-info">{{
          $t('popup.selectMode.selected', { count: selectedTabIds.length })
        }}</span>
        <button class="select-link" @click="exitSelectMode">
          {{ $t('popup.selectMode.cancel') }}
        </button>
        <button class="select-link" @click="selectAll">
          {{ $t('popup.selectMode.selectAll') }}
        </button>
      </div>
      <!-- 右侧：功能按钮区 -->
      <div class="action-bar-right">
        <!-- 删除按钮 -->
        <button
          class="delete-btn"
          @click="batchDelete"
          :disabled="selectedTabIds.length === 0"
          :title="$t('common.delete')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
        </button>
        <!-- 导出按钮 - 只在待阅清单(BUFFER)中显示，待办清单(ACTION)屏蔽 -->
        <div v-if="currentView === 'lists' && currentGroup?.listType === ListType.BUFFER" class="export-dropdown-container">
          <button
            :class="['export-btn', { disabled: isActionDisabled }]"
            @click="toggleExportDropdown"
            :disabled="isActionDisabled"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="w-6 h-6"
            >
              {/* 外框：一个圆角矩形，与旁边的文件夹风格一致 */}
              <rect x="3" y="5" width="18" height="14" rx="2" />

              {/* 内部左侧：字母 M */}
              <path d="M7 15V9l3 3 3-3v6" />

              {/* 内部右侧：向下的箭头，代表导出 */}
              <path d="M17 9v6" />
              <path d="M14 12l3 3 3-3" />
            </svg>
            {{ $t('popup.export') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div v-if="showExportDropdown" class="export-dropdown-menu">
            <button class="dropdown-item" @click="handleExport('standard')">
              <svg
                class="dropdown-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              {{ $t('popup.exportMode.standard') }}
            </button>
            <button class="dropdown-item" @click="handleExport('todo')">
              <svg
                class="dropdown-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {{ $t('popup.exportMode.todo') }}
            </button>
          </div>
        </div>
        <!-- 移动按钮 - History视图不显示 -->
        <div v-if="currentView !== 'history'" class="move-dropdown">
          <button
            :class="['move-btn', { disabled: isActionDisabled }]"
            @click="handleMoveButtonClick"
            :disabled="isActionDisabled"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path
                d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
              />
            </svg>
            {{ $t('popup.move') }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div v-if="showGroupDropdown" class="group-dropdown-menu">
            <button
              v-for="group in groups"
              :key="group.id"
              class="dropdown-item"
              @click="batchMoveToGroup(group.id)"
            >
              <!-- 待办清单：显示对号图标 -->
              <svg
                v-if="group.listType === ListType.ACTION"
                class="dropdown-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <!-- 待阅清单：显示书籍图标 -->
              <svg
                v-else-if="group.listType === ListType.BUFFER"
                class="dropdown-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <!-- 其他情况：显示原色点 -->
              <span
                v-else-if="group.color"
                class="dropdown-color-dot"
                :style="{ backgroundColor: group.color }"
              ></span>
              {{ group.name }}
            </button>
          </div>
        </div>
      </div>
    </footer>

    <!-- 新建清单弹窗 -->
    <div v-if="showCreateGroup" class="modal-overlay" @click.self="showCreateGroup = false">
      <div class="modal modern-modal modal-list-create">
        <div class="modal-header modern-modal-header">
          <h3 class="modern-modal-title">{{ $t('popup.list.create') }}</h3>
        </div>
        <div class="modal-body modern-modal-body">
          <!-- 名称输入 -->
          <input
            v-model="newGroupName"
            type="text"
            class="input modern-input"
            maxlength="30"
            :placeholder="$t('popup.list.namePlaceholder')"
            @keyup.enter="createGroup"
          />

          <!-- 清单模式选择 -->
          <div class="list-mode-selector">
            <div class="mode-label">{{ $t('popup.list.selectMode') }}</div>
            <div class="mode-cards">
              <!-- 动作清单卡片 -->
              <div
                :class="['mode-card', { active: newListType === 'action' }]"
                @click="newListType = 'action'"
              >
                <div class="mode-card-icon mode-icon-action">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div class="mode-card-content">
                  <div class="mode-card-title">{{ $t('popup.list.mode.action') }}</div>
                  <div class="mode-card-desc">{{ $t('popup.list.mode.actionDesc') }}</div>
                </div>
              </div>
              <!-- 待阅清单卡片 -->
              <div
                :class="['mode-card', { active: newListType === 'buffer' }]"
                @click="newListType = 'buffer'"
              >
                <div class="mode-card-icon mode-icon-buffer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                </div>
                <div class="mode-card-content">
                  <div class="mode-card-title">{{ $t('popup.list.mode.buffer') }}</div>
                  <div class="mode-card-desc">{{ $t('popup.list.mode.bufferDesc') }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer modern-modal-footer">
          <button class="btn modern-btn secondary" @click="showCreateGroup = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn modern-btn primary"
            @click="createGroup"
            :disabled="!newGroupName.trim()"
          >
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除分组确认弹窗 -->
    <div
      v-if="showDeleteGroupModal"
      class="modal-overlay"
      @click.self="showDeleteGroupModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ $t('popup.group.delete') }}</h3>
          <button class="modal-close" @click="showDeleteGroupModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            {{ $t('popup.group.deleteConfirm', { name: groupToDelete?.name }) }}
          </p>
          <p class="delete-hint">
            {{ $t('popup.group.deleteHint', { count: getTabsInGroup(groupToDelete?.id) }) }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showDeleteGroupModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn danger" @click="deleteGroup">{{ $t('common.delete') }}</button>
        </div>
      </div>
    </div>

    <!-- 删除标签确认弹窗 -->
    <div
      v-if="showDeleteTabModal"
      class="modal-overlay"
      @click.self="showDeleteTabModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ $t('common.delete') }}</h3>
          <button class="modal-close" @click="showDeleteTabModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            <template v-if="isBatchDelete">
              {{ $t('popup.tab.batchDeleteConfirm', { count: batchDeleteCount }) }}
            </template>
            <template v-else>
              {{ $t('popup.tab.deleteConfirm', { title: tabToDelete?.title }) }}
            </template>
          </p>
          <p class="delete-hint">
            {{ $t('popup.tab.deleteHint') }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showDeleteTabModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn danger" @click="executeDelete">
            {{ $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 清空History确认弹窗 -->
    <div
      v-if="showClearHistoryModal"
      class="modal-overlay"
      @click.self="showClearHistoryModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ $t('popup.history.clearAll') }}</h3>
          <button class="modal-close" @click="showClearHistoryModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            {{ $t('popup.history.clearAllConfirm') }}
          </p>
          <p class="delete-hint">
            {{ $t('popup.history.clearAllHint') }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showClearHistoryModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn danger" @click="executeClearHistory">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导出后删除确认弹窗 -->
    <div
      v-if="showExportConfirmModal"
      class="modal-overlay"
      @click.self="showExportConfirmModal = false"
    >
      <div class="modal">
        <div class="modal-header">
          <h3>{{ $t('popup.exportMode.confirmDeleteTitle') }}</h3>
          <button class="modal-close" @click="showExportConfirmModal = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            {{ $t('popup.exportMode.confirmDeleteMessage', { count: exportedTabs.length }) }}
          </p>
          <p class="delete-hint">
            {{ $t('popup.exportMode.confirmDeleteHint') }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showExportConfirmModal = false">
            {{ $t('common.cancel') }}
          </button>
          <button class="btn danger" @click="executeExportDelete">
            {{ $t('common.confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 通知组件 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, inject } from 'vue';
import { formatRelativeTime, getDomain } from '../common/utils/date';
import { MESSAGE_TYPES } from '../common/constants';
import { GROUP_COLORS, ViewType, ListType } from '../common/types/group';
import type { TabItem } from '../common/types/tab';
import type { Group } from '../common/types/group';
import { themeManager } from '../common/services/themeService';
import { t as rawT } from '../common/i18n';
import { initTheme, setupThemeSync } from '../common/theme';
import Toast from './components/Toast.vue';
import ViewSelector from './components/ViewSelector.vue';

// Get t function from i18n injection
const t = inject<(key: string, params?: Record<string, string | number>) => string>('t', rawT);

// Color palette for modern modal (Notion/Linear style)
const COLORS = [
  '#3b82f6', // bg-blue-500 - 品牌蓝 (Brand Blue)
  '#0ea5e9', // bg-sky-500 - 天蓝
  '#06b6d4', // bg-cyan-500 - 青色
  '#14b8a6', // bg-teal-500 - 水鸭青
  '#10b981', // bg-emerald-500 - 祖母绿
  '#22c55e', // bg-green-500 - 草绿
  '#84cc16', // bg-lime-500 - 青柠
  '#facc15', // bg-yellow-400 - 明黄
  '#f97316', // bg-orange-500 - 橘橙
  '#ef4444', // bg-red-500 - 红色
  '#ec4899', // bg-pink-500 - 粉色
  '#94a3b8', // bg-slate-400 - 岩灰
];

// 状态
const searchQuery = ref('');
const selectedGroupId = ref<string | undefined>();
const currentView = ref<ViewType>(ViewType.INBOX); // Default to Inbox view
const tabs = ref<TabItem[]>([]);
const groups = ref<Group[]>([]);
const theme = ref<'light' | 'dark' | 'system'>('light');
const mode = ref<'normal' | 'select'>('normal');
const selectedTabIds = ref<string[]>([]);
const showGroupDropdown = ref(false);
const showCreateGroup = ref(false);
const newGroupName = ref('');
const newGroupColor = ref(COLORS[0]); // Default to first color (blue-500)
const newListType = ref<ListType>(ListType.ACTION); // Default to Action List
const pastelColors = COLORS;
const loaded = ref(false);
const activeTabGroupDropdown = ref<string | null>(null);
const showDeleteGroupModal = ref(false);
const groupToDelete = ref<Group | null>(null);
const isSyncing = ref(false); // 同步状态
const syncMessage = ref(''); // 同步消息
const showExportDropdown = ref(false); // 导出下拉菜单显示状态
const toastRef = ref<InstanceType<typeof Toast> | null>(null);
const showUnsyncedBadge = ref(true); // 是否显示未同步角标
const confirmSingleDelete = ref(false); // 是否在删除单个标签时确认

// 删除确认弹窗状态
const showDeleteTabModal = ref(false);
const tabToDelete = ref<TabItem | null>(null);
const isBatchDelete = ref(false); // 是否批量删除
const batchDeleteCount = ref(0); // 批量删除数量
const showClearHistoryModal = ref(false); // 清空History确认弹窗

// 导出确认弹窗状态
const showExportConfirmModal = ref(false);
const exportedTabs = ref<TabItem[]>([]); // 已导出的tabs

// 打开设置页面
function openSettingsPage(): void {
  chrome.runtime.openOptionsPage();
}

// 手动同步
async function manualSync(): Promise<void> {
  if (isSyncing.value) return;

  // Step 1: Configuration Check (Pre-flight)
  const settingsResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_GET });

  const webdav = settingsResponse?.data?.webdav;

  if (!webdav || !webdav.url || !webdav.username || !webdav.password) {
    // 配置缺失，显示错误提示，2秒后打开设置页面
    toastRef.value?.error('WebDAV 未配置，请先配置同步信息');
    setTimeout(() => {
      chrome.runtime.openOptionsPage();
    }, 2000);
    return;
  }

  // Step 2: Sync Execution with proper state management
  isSyncing.value = true;

  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SYNC_REQUEST });

    // handleMessage 包装后的结构是 { success: true, data: SyncResult }
    // 需要检查 response.data.success 来判断同步是否真正成功
    if (response?.success && response?.data) {
      const syncResult = response.data as { success: boolean; uploaded?: number; downloaded?: number; error?: string };

      if (syncResult.success) {
        // 同步成功
        toastRef.value?.success(
          t('sync.syncComplete', {
            uploaded: syncResult.uploaded || 0,
            downloaded: syncResult.downloaded || 0,
          })
        );
      } else {
        // 同步失败（syncEngine 返回了 success: false），2秒后打开设置页面
        const errorMsg = syncResult.error || t('errors.unknown');
        console.error('[ManualSync] 同步失败:', errorMsg);
        toastRef.value?.error(getSyncErrorMessage(errorMsg));
        setTimeout(() => {
          chrome.runtime.openOptionsPage();
        }, 2000);
      }
    } else {
      // 消息处理失败（不太可能走到这里，因为 handleMessage 总是返回 success: true）
      const errorMsg = response?.error || t('errors.unknown');
      console.error('[ManualSync] 消息处理失败:', errorMsg);
      toastRef.value?.error(getSyncErrorMessage(errorMsg));
      setTimeout(() => {
        chrome.runtime.openOptionsPage();
      }, 2000);
    }

    // 重新加载数据（仅在成功时）
    if (response?.success && response?.data && (response.data as any).success) {
      await loadData();
    }
  } catch (error) {
    console.error('[ManualSync] Sync error:', error);
    const errorMsg = String(error);
    toastRef.value?.error(getSyncErrorMessage(errorMsg));
    setTimeout(() => {
      chrome.runtime.openOptionsPage();
    }, 2000);
  } finally {
    isSyncing.value = false;
  }
}

/**
 * Get user-friendly sync error message based on error content
 */
function getSyncErrorMessage(error: string): string {
  if (error.includes('401') || error.includes('403')) {
    return '用户名或密码错误 (Invalid credentials)';
  } else if (error.includes('404') || error.includes('ENOTFOUND')) {
    return '连接失败，请检查 URL (Connection failed, check URL)';
  } else if (error.includes('ECONNREFUSED') || error.includes('timeout')) {
    return '连接超时，请检查网络 (Connection timeout)';
  } else if (error.includes('certificate')) {
    return 'SSL 证书错误 (SSL certificate error)';
  }
  // Generic error message
  return `同步失败: ${error} (Sync failed)`;
}

// 导出 Markdown
async function handleExport(mode: 'standard' | 'todo'): Promise<void> {
  if (selectedTabIds.value.length === 0) return;

  showExportDropdown.value = false;

  // 获取选中的标签
  const tabsToExport = tabs.value.filter(tab => selectedTabIds.value.includes(tab.id));
  if (tabsToExport.length === 0) return;

  // 按 groupId 分组
  const tabsByGroup = new Map<string | null, typeof tabsToExport>();

  for (const tab of tabsToExport) {
    const groupKey = tab.groupId || null;
    if (!tabsByGroup.has(groupKey)) {
      tabsByGroup.set(groupKey, []);
    }
    tabsByGroup.get(groupKey)!.push(tab);
  }

  // 生成日期字符串 YYYY-MM-DD
  const dateStr = new Date().toISOString().slice(0, 10);

  // 生成 Markdown 内容
  let markdownContent = '';

  for (const [groupId, groupTabs] of tabsByGroup) {
    // 获取分组名称
    let groupName: string;
    if (groupId && groups.value.find(g => g.id === groupId)) {
      groupName = groups.value.find(g => g.id === groupId)!.name;
    } else {
      groupName = t('popup.uncategorized');
    }

    // 添加分组标题（加粗）
    markdownContent += `- **${groupName}**\n`;

    // 添加该分组下的标签（带递增序号）
    let itemNumber = 1;
    for (const tab of groupTabs) {
      if (mode === 'standard') {
        // 标准清单模式：编号列表（序号递增）
        markdownContent += `${itemNumber++}. [${tab.title}](${tab.url})\n`;
      } else {
        // 待办任务模式：勾选列表
        markdownContent += `- [ ] [${tab.title}](${tab.url})\n`;
      }
    }

    // 分组之间添加空行
    markdownContent += '\n';
  }

  // 文件名格式：TabDav_Export_[Mode]_[YYYY-MM-DD].md
  const modeName = mode === 'standard' ? 'Standard' : 'Todo';
  const filename = `TabDav_Export_${modeName}_${dateStr}.md`;

  // 创建并下载文件
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // 待阅清单导出后，询问是否删除已导出的tabs
  if (currentGroup.value?.listType === ListType.BUFFER) {
    exportedTabs.value = tabsToExport;
    showExportConfirmModal.value = true;
  } else {
    // 其他清单类型，直接清空选择并退出批量模式
    selectedTabIds.value = [];
    mode.value = 'normal';
  }
}

// 执行导出后删除（从确认弹窗调用）
async function executeExportDelete(): Promise<void> {
  showExportConfirmModal.value = false;

  // 将已导出的tabs移动到History
  for (const tab of exportedTabs.value) {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_DELETE,
      payload: { id: tab.id, status: 'completed' },
    });
  }

  // 重新加载数据
  await loadData();
  // 清空选择
  selectedTabIds.value = [];
  // 退出批量选择模式
  mode.value = 'normal';
  // 清空已导出的tabs
  exportedTabs.value = [];
}

// 切换导出模式下拉菜单
function toggleExportDropdown(): void {
  showExportDropdown.value = !showExportDropdown.value;
}

// 计算属性
const isActionDisabled = computed(() => selectedTabIds.value.length === 0);

// 分组标签数量映射（排除已归档到History的Tab）
const groupTabCounts = computed(() => {
  const counts: Record<string, number> = {};
  const tabList = tabs.value || [];
  for (const tab of tabList) {
    // 只统计未���除的Tab（排除已归档到History的Tab）
    if (tab && tab.groupId && !tab.deletedAt) {
      counts[tab.groupId] = (counts[tab.groupId] || 0) + 1;
    }
  }
  return counts;
});

// Inbox Tab数量（排除已删除的Tab）
const inboxTabCount = computed(() => {
  const tabList = tabs.value || [];
  return tabList.filter(tab => !tab.groupId && !tab.deletedAt).length;
});

const stats = computed(() => {
  const statsObj = { total: 0, synced: 0, pending: 0, error: 0 };
  const tabList = tabs.value || [];
  if (!Array.isArray(tabList)) return statsObj;

  for (const tab of tabList) {
    if (tab && typeof tab === 'object') {
      statsObj.total++;
      if (tab.syncStatus === 'synced') statsObj.synced++;
      else if (tab.syncStatus === 'pending') statsObj.pending++;
      else if (tab.syncStatus === 'error') statsObj.error++;
    }
  }
  return statsObj;
});

// Stats for Lists view (only tabs with groupId)
const listStats = computed(() => {
  const statsObj = { total: 0, synced: 0, pending: 0, error: 0 };
  const tabList = tabs.value || [];
  if (!Array.isArray(tabList)) return statsObj;

  for (const tab of tabList) {
    if (tab && typeof tab === 'object' && tab.groupId) {
      statsObj.total++;
      if (tab.syncStatus === 'synced') statsObj.synced++;
      else if (tab.syncStatus === 'pending') statsObj.pending++;
      else if (tab.syncStatus === 'error') statsObj.error++;
    }
  }
  return statsObj;
});

// 当前选中的分组
const currentGroup = computed(() => {
  if (!selectedGroupId.value) return undefined;
  return groups.value.find(g => g.id === selectedGroupId.value);
});

const filteredTabs = computed(() => {
  const tabList = tabs.value || [];
  let result: TabItem[] = Array.isArray(tabList) ? tabList : [];

  // Filter based on current view
  if (currentView.value === ViewType.INBOX) {
    // Inbox: Show only uncategorized tabs that are NOT deleted
    result = result.filter(t => !t.groupId && !t.deletedAt);
  } else if (currentView.value === ViewType.LISTS) {
    // Lists: Show tabs in groups (with groupId) that are NOT deleted
    if (selectedGroupId.value) {
      result = result.filter(t => t.groupId === selectedGroupId.value && !t.deletedAt);
    } else {
      result = result.filter(t => t.groupId && !t.deletedAt);
    }
  } else if (currentView.value === ViewType.HISTORY) {
    // History: Show ONLY deleted/archived tabs (with deletedAt)
    result = result.filter(t => t.deletedAt);
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      t => t.title.toLowerCase().includes(query) || t.url.toLowerCase().includes(query)
    );
  }

  // Sort by creation time (newest first) - for History, sort by deletedAt
  result.sort((a, b) => {
    const timeA = currentView.value === ViewType.HISTORY ? (a.deletedAt || a.createdAt) : a.createdAt;
    const timeB = currentView.value === ViewType.HISTORY ? (b.deletedAt || b.createdAt) : b.createdAt;
    return timeB - timeA;
  });
  return result;
});

// 是否显示未同步角标（结合设置和pending数量）
const showBadge = computed(() => {
  return showUnsyncedBadge.value && stats.value.pending > 0;
});

// 方法
function formatUrl(url: string): string {
  try {
    return getDomain(url);
  } catch {
    return url;
  }
}

function formatTime(timestamp: number): string {
  return formatRelativeTime(timestamp, t);
}

function getSyncStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    synced: t('popup.tab.synced'),
    pending: t('popup.tab.pending'),
    error: t('popup.tab.syncError'),
  };
  return statusMap[status] || status;
}

// Get empty state title based on current view
function getEmptyTitle(): string {
  if (currentView.value === ViewType.INBOX) {
    return t('popup.noTabs');
  } else if (currentView.value === ViewType.LISTS) {
    return selectedGroupId.value ? t('popup.noTabs') : t('popup.group.create');
  } else {
    return t('popup.noTabs');
  }
}

// Get empty state subtitle based on current view
function getEmptySubtitle(): string {
  if (currentView.value === ViewType.INBOX) {
    return t('popup.emptySubtitle');
  } else if (currentView.value === ViewType.LISTS) {
    if (selectedGroupId.value) {
      return t('popup.emptySubtitle');
    } else {
      return groups.value.length === 0
        ? t('popup.viewDescription.lists')
        : t('popup.emptySubtitle');
    }
  } else {
    return t('popup.viewDescription.history');
  }
}

function handleFaviconError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
}

function isExcludedUrl(url: string): boolean {
  return /^chrome:\/\//.test(url) || /^about:/.test(url);
}

// 确认删除单个标签
function confirmDeleteTab(tab: TabItem): void {
  tabToDelete.value = tab;
  isBatchDelete.value = false;
  showDeleteTabModal.value = true;
}

// 确认批量删除
function confirmBatchDelete(): void {
  tabToDelete.value = null;
  isBatchDelete.value = true;
  batchDeleteCount.value = selectedTabIds.value.length;
  showDeleteTabModal.value = true;
}

// 确认清空History
function confirmClearHistory(): void {
  showClearHistoryModal.value = true;
}

// 执行清空History（从确认弹窗调用）
async function executeClearHistory(): Promise<void> {
  // 获取所有History中的tab（deletedAt不为空的）
  const historyTabs = tabs.value.filter(t => t.deletedAt);
  const historyTabIds = historyTabs.map(t => t.id);

  if (historyTabIds.length === 0) {
    showClearHistoryModal.value = false;
    return;
  }

  // 批量永久删除
  await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TAB_PERMANENT_DELETE,
    payload: { ids: historyTabIds },
  });

  showClearHistoryModal.value = false;
  await loadData();
}

// 执行删除（从确认弹窗调用）
async function executeDelete(): Promise<void> {
  // 判断当前视图是否是History视图
  const isHistoryView = currentView.value === ViewType.HISTORY;
  const messageType = isHistoryView ? MESSAGE_TYPES.TAB_PERMANENT_DELETE : MESSAGE_TYPES.TAB_DELETE;

  if (isBatchDelete.value) {
    // 批量删除
    const ids = selectedTabIds.value;

    await chrome.runtime.sendMessage({
      type: messageType,
      payload: { ids },
    });

    exitSelectMode();
  } else if (tabToDelete.value) {
    // 单个删除
    const id = tabToDelete.value.id;
    await chrome.runtime.sendMessage({
      type: messageType,
      payload: { id },
    });
    activeTabGroupDropdown.value = null;
  }

  // 重新加载数据以显示正确的状态
  await loadData();

  // 关闭弹窗
  showDeleteTabModal.value = false;
  tabToDelete.value = null;
}

// Tab操作
async function openTab(tab: TabItem | null): Promise<void> {
  if (!tab) return;

  // Lists视图中的待办清单：打开页面并标记为已完成（移动到History）
  // 待阅清单不自动删除
  if (currentView.value === ViewType.LISTS && currentGroup.value?.listType === ListType.ACTION) {
    // 先标记为已完成
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_DELETE,
      payload: { id: tab.id, status: 'completed' },
    });
  }

  // 打开页面
  await chrome.tabs.create({ url: tab.url, active: true });
  window.close();
}

async function deleteTab(id: string | undefined): Promise<void> {
  if (!id) return;

  const tab = tabs.value.find(t => t.id === id);
  if (!tab) return;

  // 检查是否需要确认
  if (confirmSingleDelete.value) {
    // 显示确认弹窗
    confirmDeleteTab(tab);
  } else {
    // 直接删除
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_DELETE,
      payload: { id },
    });
    // 重新加载数据以显示正确的状态（tabs会移动到History）
    await loadData();
    activeTabGroupDropdown.value = null;
  }
}

// History视图：恢复Tab
async function restoreTab(id: string): Promise<void> {
  await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TAB_RESTORE,
    payload: { id },
  });
  await loadData();
}

// History视图：永久删除Tab
async function permanentDeleteTab(id: string): Promise<void> {
  await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TAB_PERMANENT_DELETE,
    payload: { id },
  });
  await loadData();
}

// 复制Tab为Markdown格式
async function copyTabAsMarkdown(tab: TabItem): Promise<void> {
  try {
    // 构建 Markdown 格式: [Title](URL)
    const markdown = `[${tab.title}](${tab.url})`;

    // 使用 Clipboard API 复制
    await navigator.clipboard.writeText(markdown);

    // 显示成功提示
    toastRef.value?.success(t('popup.tab.copySuccess'));
  } catch (error) {
    console.error('Failed to copy:', error);
    toastRef.value?.error('Copy failed');
  }
}

function handleTabClick(tab: TabItem): void {
  if (mode.value === 'select') {
    toggleSelect(tab.id);
  } else {
    openTab(tab);
  }
}

function toggleSelect(id: string): void {
  const index = selectedTabIds.value.indexOf(id);
  if (index === -1) {
    selectedTabIds.value.push(id);
  } else {
    selectedTabIds.value.splice(index, 1);
  }
}

function selectAll(): void {
  const list = Array.isArray(filteredTabs.value) ? filteredTabs.value : [];
  selectedTabIds.value = list.map(t => t.id);
}

function toggleTabGroupDropdown(tabId: string): void {
  if (activeTabGroupDropdown.value === tabId) {
    activeTabGroupDropdown.value = null;
  } else {
    activeTabGroupDropdown.value = tabId;
  }
}

async function moveTabToGroup(
  tabId: string | undefined,
  groupId: string | undefined
): Promise<void> {
  if (!tabId) return;
  await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TAB_MOVE_TO_GROUP,
    payload: { tabIds: [tabId], groupId: groupId || '' },
  });

  const tab = tabs.value.find(t => t.id === tabId);
  if (tab) {
    tab.groupId = groupId;
  }

  activeTabGroupDropdown.value = null;
}

async function batchDelete(): Promise<void> {
  // 批量删除始终显示确认弹窗
  confirmBatchDelete();
}

function enterSelectMode(): void {
  mode.value = 'select';
  selectedTabIds.value = [];
}

function exitSelectMode(): void {
  mode.value = 'normal';
  selectedTabIds.value = [];
  showGroupDropdown.value = false;
}

// 处理移动按钮点击
function handleMoveButtonClick(): void {
  if (selectedTabIds.value.length === 0) return;

  // 如果没有分组，提示并打开新建分组弹窗
  if (groups.value.length === 0) {
    toastRef.value?.warning('暂无分组，请先新建');
    showCreateGroup.value = true;
    return;
  }

  // 有分组，切换下拉菜单
  showGroupDropdown.value = !showGroupDropdown.value;
}

async function batchMoveToGroup(groupId: string): Promise<void> {
  if (selectedTabIds.value.length === 0) return;

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TAB_MOVE_TO_GROUP,
    payload: { tabIds: selectedTabIds.value, groupId },
  });

  for (const id of selectedTabIds.value) {
    const tab = tabs.value.find(t => t.id === id);
    if (tab) {
      tab.groupId = groupId;
    }
  }

  showGroupDropdown.value = false;
  exitSelectMode();
}

// 分组操作
async function createGroup(): Promise<void> {
  if (!newGroupName.value.trim()) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GROUP_CREATE,
      payload: {
        name: newGroupName.value.trim(),
        color: newGroupColor.value,
        listType: newListType.value,
      },
    });

    if (response && (response as any).success && (response as any).data) {
      const group = (response as any).data as Group;
      groups.value.push(group);
      newGroupName.value = '';
      newGroupColor.value = COLORS[0]; // Reset to first color (blue-500)
      newListType.value = ListType.ACTION; // Reset to Action List
      showCreateGroup.value = false;
    } else {
      console.error('[DEBUG createGroup] 创建失败:', response);
    }
  } catch (e) {
    console.error('创建分组失败:', e);
  }
}

function getTabsInGroup(groupId: string | undefined): number {
  if (!groupId) return 0;
  // 排除已归档到History的Tab
  return tabs.value.filter(t => t.groupId === groupId && !t.deletedAt).length;
}

function getGroupDotColor(group: Group): string {
  // 根据清单类型返回对应的颜色
  if (group.listType === ListType.ACTION) {
    return '#22c55e'; // 绿色 - 待办清单
  }
  if (group.listType === ListType.BUFFER) {
    return '#3b82f6'; // 蓝色 - 待阅清单
  }
  // 没有类型或旧数据，使用自定义颜色或默认灰色
  return group.color || '#9ca3af';
}

// 获取History视图中tab的原始分组
function getOriginalGroup(tab: TabItem): Group | undefined {
  if (!tab.originalGroupId) return undefined;
  return groups.value.find(g => g.id === tab.originalGroupId);
}

// 计算tab在inbox中存放的天数
function getInboxDays(tab: TabItem): number {
  // 优先使用inboxAt，如果没有则使用createdAt作为fallback
  const inboxTime = tab.inboxAt || tab.createdAt;
  const days = Math.floor((Date.now() - inboxTime) / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

function confirmDeleteGroup(group: Group): void {
  groupToDelete.value = group;
  showDeleteGroupModal.value = true;
}

async function deleteGroup(): Promise<void> {
  if (!groupToDelete.value) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GROUP_DELETE,
      payload: { id: groupToDelete.value.id, deleteTabs: false },
    });

    if (response && (response as any).success) {
      // 重新加载数据以获取更新后的tabs（groupId已设为undefined，回归Inbox）
      await loadData();

      // 如果当前选中的分组被删除，选中第一个剩余分组（如果有）
      if (selectedGroupId.value === groupToDelete.value!.id) {
        selectedGroupId.value = groups.value.length > 0 ? groups.value[0].id : undefined;
      }
      showDeleteGroupModal.value = false;
      groupToDelete.value = null;
    }
  } catch (e) {
    console.error('删除分组失败:', e);
  }
}

async function collectCurrentTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !tab.title || !tab.id) return;

  if (isExcludedUrl(tab.url)) {
    alert(t('notifications.cannotCollect'));
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.TAB_ADD,
    payload: { url: tab.url, title: tab.title, favicon: tab.favIconUrl },
  });

  if (response && (response as any).isDuplicate) {
    alert(t('notifications.collectDuplicate'));
  } else {
    await loadData();

    // 收藏后关闭页面
    const settings = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_GET });
    if (settings?.data?.closeAfterCollect) {
      try {
        await chrome.tabs.remove(tab.id);
      } catch (e) {
        console.error('[TabDav] 关闭标签页失败:', e);
      }
    }
  }
}

async function collectAllTabs(): Promise<void> {
  const allTabs = await chrome.tabs.query({});
  const validTabs = allTabs.filter(t => t.url && t.title && !isExcludedUrl(t.url));

  // 收藏所有有效标签
  for (const tab of validTabs) {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_ADD,
      payload: { url: tab.url!, title: tab.title!, favicon: tab.favIconUrl },
    });
  }

  await loadData();

  // 收藏后关闭页面
  const settings = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_GET });
  if (settings?.data?.closeAfterCollect) {
    const tabIdsToClose = validTabs.filter(t => t.id).map(t => t.id!);
    if (tabIdsToClose.length > 0) {
      try {
        await chrome.tabs.remove(tabIdsToClose);
      } catch (e) {
        console.error('[TabDav] 批量关闭标签页失败:', e);
      }
    }
  }
}

// 数据加载
async function loadData(): Promise<void> {
  try {
    const tabResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TAB_GET_ALL });
    // handleMessage 会返回 {success: true, data: result}，result 就是 tabs 数组
    if (tabResponse?.success && Array.isArray(tabResponse?.data)) {
      tabs.value = tabResponse.data;
    } else {
      tabs.value = [];
    }
  } catch (e) {
    console.error('加载标签失败:', e);
    tabs.value = [];
  }

  try {
    const groupResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GROUP_GET_ALL });
    if (groupResponse.success && Array.isArray(groupResponse.data)) {
      groups.value = groupResponse.data;
    } else {
      groups.value = [];
    }
  } catch (e) {
    console.error('加载分组失败:', e);
    groups.value = [];
  }

  try {
    const settingsResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_GET });
    if (settingsResponse.success && settingsResponse.data) {
      theme.value = (settingsResponse.data as any)?.theme || 'light';
      showUnsyncedBadge.value = (settingsResponse.data as any)?.showUnsyncedBadge !== false; // 默认 true
      confirmSingleDelete.value = (settingsResponse.data as any)?.confirmSingleDelete === true; // 默认 false
    }
  } catch (e) {
    console.error('加载设置失败:', e);
    theme.value = 'light';
  }

  // 执行Inbox清理：自动将超过7天未处理的tabs移到History
  try {
    const cleanupResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TAB_CLEANUP_INBOX });
    if (cleanupResponse?.success && (cleanupResponse as any).count > 0) {
      // 如果有tabs被清理，重新加载数据
      const tabResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TAB_GET_ALL });
      if (tabResponse?.success && Array.isArray(tabResponse?.data)) {
        tabs.value = tabResponse.data;
      }
    }
  } catch (e) {
    console.error('Inbox清理失败:', e);
  }

  // 执行History清理：永久删除超过30天的tabs
  try {
    const historyCleanupResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TAB_CLEANUP_HISTORY });
    if (historyCleanupResponse?.success && (historyCleanupResponse as any).count > 0) {
      // 如果有tabs被永久删除，重新加载数据
      const tabResponse = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.TAB_GET_ALL });
      if (tabResponse?.success && Array.isArray(tabResponse?.data)) {
        tabs.value = tabResponse.data;
      }
    }
  } catch (e) {
    console.error('History清理失败:', e);
  }

  loaded.value = true;
}

// 生命周期
onMounted(async () => {
  loadData();
  // 点击其他地方关闭分组下拉菜单
  document.addEventListener('click', () => {
    activeTabGroupDropdown.value = null;
  });
  // Initialize theme system
  await initTheme();
  // Setup theme sync across extension pages
  setupThemeSync();
});

// 监听主题变化，实时应用
watch(
  () => theme.value,
  newTheme => {
    themeManager.setTheme(newTheme);
  }
);

// 监听视图变化，自动选择分组
watch(
  () => currentView.value,
  (newView) => {
    if (newView === ViewType.LISTS) {
      // 切换到 Lists 视图时，自动选中第一个分组（如果有）
      selectedGroupId.value = groups.value.length > 0 ? groups.value[0].id : undefined;
    } else {
      // 切换到其他视图时，重置分组选择
      selectedGroupId.value = undefined;
    }
  }
);
</script>

<style>
/* ========== 主容器 ========== */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-primary);
}

/* ========== 头部 ========== */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

/* Premium Brand Logo - Modern Version */
.brand-logo-mini {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-button);
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.brand-logo-mini:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-button-hover);
}

.brand-logo-mini svg {
  width: 18px;
  height: 18px;
  color: var(--text-inverse);
}

.app-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin: 0;
}

.sync-badge {
  font-size: var(--font-size-xs);
  color: var(--color-warning);
  background-color: var(--color-warning-light);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.total-badge {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-full);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.header-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.header-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.header-btn:active {
  transform: scale(0.96);
}

.header-btn svg {
  width: 18px;
  height: 18px;
}

/* 同步按钮样式 */
.sync-btn {
  position: relative;
}

.sync-btn.syncing {
  color: var(--color-primary);
}

.sync-btn.syncing svg {
  animation: spin 1s linear infinite;
}

/* 同步角标 - Modern Badge */
.sync-badge-dot {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
  text-align: center;
  color: var(--text-inverse);
  background-color: var(--color-error);
  border-radius: var(--radius-full);
  z-index: 1;
  box-shadow: var(--shadow-xs);
  border: 2px solid var(--bg-primary);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 旋转动画类 */
.spinning {
  animation: spin 1s linear infinite;
}

/* ========== 搜索栏 ========== */
.search-bar {
  position: relative;
  padding: var(--spacing-2) var(--spacing-4);
  background-color: var(--bg-primary);
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: calc(var(--spacing-4) + var(--spacing-2));
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
  transition: color var(--transition-fast);
}

.search-input {
  width: 100%;
  height: var(--input-height-md);
  padding: 0 var(--spacing-3) 0 40px;
  font-size: var(--font-size-sm);
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-xs);
}

.search-input:hover {
  background-color: var(--bg-primary);
  border-color: var(--color-primary-200);
}

.search-input:focus {
  outline: none;
  background-color: var(--bg-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-input:focus + .search-icon {
  color: var(--color-primary);
}

.search-input:disabled {
  background-color: var(--bg-tertiary);
  cursor: not-allowed;
  opacity: 0.6;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

/* ========== 统一工具栏（单行布局） ========== */
.unified-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
  min-height: 40px;
}

/* 左侧：视图选择器 + 添加按钮 */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-shrink: 0;
}

/* 右侧：分组标签栏 */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: var(--border-color);
  flex-shrink: 0;
}

/* Inbox Count Badge */
.inbox-count-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
  border-radius: 16px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background-color: var(--bg-hover);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
  min-width: 48px;
}

/* Normal state (1-20 tabs): light green pill */
.inbox-count-badge.is-normal {
  background-color: #dcfce7;
  color: #16a34a;
}

.inbox-count-badge .badge-count {
  font-variant-numeric: tabular-nums;
}

/* Empty state (0 tabs): green checkmark, transparent background */
.inbox-count-badge.is-empty {
  background-color: transparent;
  color: var(--color-success, #22c55e);
}

.inbox-count-badge.is-empty .badge-icon {
  width: 16px;
  height: 16px;
}

/* Warning state (> 20 tabs): orange pill */
.inbox-count-badge.is-warning {
  background-color: var(--color-warning-light, #fed7aa);
  color: var(--color-warning, #ea580c);
}

/* 内联分组标签栏 */
.group-tabs-inline {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-width: 0;
  scrollbar-width: none;
}

.group-tabs-inline::-webkit-scrollbar {
  display: none;
}

/* 内联分组标签 - 紧凑的文字链接风格 */
.group-tab-inline {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-regular);
  color: var(--text-secondary);
  background-color: transparent;
  border: none;
  border-radius: var(--radius-md);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.group-tab-inline:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.group-tab-inline.active {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  background-color: var(--color-primary-light);
}

/* 标签计数 - 更紧凑 */
.group-tab-inline .tab-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-left: 2px;
}

.group-tab-inline.active .tab-count {
  color: var(--color-primary);
  opacity: 0.8;
}

/* 分组标签分隔符 */
.group-tab-divider {
  width: 1px;
  height: 16px;
  background-color: var(--border-color);
  flex-shrink: 0;
}

/* 内联分组圆点 */
.group-dot-inline {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* 内联删除按钮 - 仅悬停显示 */
.group-delete-btn-inline {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-left: 2px;
  padding: 0;
  opacity: 0;
}

.group-tab-inline:hover .group-delete-btn-inline {
  opacity: 1;
}

.group-delete-btn-inline:hover {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.group-delete-btn-inline svg {
  width: 10px;
  height: 10px;
}

/* 新建列表按钮 */
.add-list-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
  padding: 0;
}

.add-list-btn:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  border-color: var(--color-primary-200);
}

.add-list-btn:active {
  transform: scale(0.96);
}

.add-list-btn svg {
  width: 16px;
  height: 16px;
}

/* 清空History按钮 */
.clear-history-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.clear-history-btn svg {
  width: 14px;
  height: 14px;
}

.clear-history-btn:hover {
  background-color: #fef2f2;
  color: #dc2626;
  border-color: #fca5a5;
}

[data-theme='dark'] .clear-history-btn:hover {
  background-color: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: #ef4444;
}

.clear-history-btn:active {
  transform: scale(0.96);
}

.group-tab.add-group {
  padding: 4px 6px;
  border-radius: var(--radius-full);
}

.group-tab.add-group svg {
  width: 14px;
  height: 14px;
}

/* 分组删除按钮 */
.group-delete-btn {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  opacity: 0;
  transition: all var(--transition-fast);
  margin-left: 2px;
  padding: 0;
}

.group-tab:hover .group-delete-btn {
  opacity: 1;
}

.group-delete-btn:hover {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.group-delete-btn svg {
  width: 8px;
  height: 8px;
}

/* ========== 标签列表 ========== */
.tab-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-1) 0;
}

/* Empty State - Modern Design */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8) var(--spacing-6);
  color: var(--text-tertiary);
  text-align: center;
}

.empty-illustration {
  width: 88px;
  height: 88px;
  margin-bottom: var(--spacing-4);
  color: var(--bg-tertiary);
  opacity: 0.8;
}

.empty-state .empty-title {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
}

.empty-state .empty-subtitle {
  margin: var(--spacing-1) 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  line-height: var(--line-height-base);
}

/* Tab Item - Modern Card Design */
.tab-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-bottom: 1px solid var(--border-color-light);
  position: relative;
}

.tab-item:last-child {
  border-bottom: none;
}

.tab-item:hover {
  background-color: var(--bg-secondary);
}

.tab-item.selected {
  background-color: var(--color-primary-light);
}

.tab-favicon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
  border-radius: var(--radius-sm);
}

.tab-favicon-placeholder {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.tab-favicon-placeholder svg {
  width: 10px;
  height: 10px;
  color: var(--text-tertiary);
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: var(--spacing-1);
}

.tab-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: var(--line-height-tight);
}

.tab-meta-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.tab-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.meta-separator {
  color: var(--text-disabled);
  flex-shrink: 0;
}

.tab-group-info {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.tab-group-info .group-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.group-name {
  color: var(--text-tertiary);
}

.tab-time {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.sync-status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-left: var(--spacing-1);
}

.sync-status-icon.pending {
  color: #9ca3af;
}

.sync-status-icon.error {
  color: var(--color-error);
}

/* 呼吸动画 - 模拟待同步状态 */
@keyframes pulse-opacity {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse-opacity 2s ease-in-out infinite;
}

/* Inbox清理机制图标 */
.leaf-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.leaf-icon.green-leaf {
  color: #22c55e; /* 绿色 - 新收藏 */
}

.leaf-icon.yellow-leaf {
  color: #eab308; /* 黄色 - 需要处理 */
}

.wind-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #9ca3af; /* 灰色 - 被风吹来的 */
}

/* 操作按钮 - 悬停显示，Modern Design */
.tab-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.tab-item:hover .tab-actions {
  opacity: 1;
}

.tab-action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab-action-btn:hover {
  background-color: var(--bg-active);
  color: var(--text-primary);
}

.tab-action-btn.danger:hover {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.tab-action-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.tab-action-btn svg {
  width: 14px;
  height: 14px;
}

/* ========== Tab操作按钮组 ========== */
.tab-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.tab-action-dropdown {
  position: relative;
}

.tab-group-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  width: 192px; /* w-48 */
  min-width: 150px;
  background-color: #ffffff;
  border: 1px solid #f3f4f6; /* border-gray-100 */
  border-radius: 8px; /* rounded-lg */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-xl */
  z-index: 50;
  padding: 4px 0; /* py-1 */
  overflow: hidden;
}

/* Dark mode support */
[data-theme='dark'] .tab-group-dropdown-menu {
  background-color: var(--bg-primary);
  border-color: var(--border-color);
}

.tab-group-dropdown-menu .dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px; /* gap-3 */
  width: 100%;
  padding: 10px 16px; /* px-4 py-2.5 */
  font-size: 14px; /* text-sm */
  font-weight: 500; /* font-medium */
  color: #374151; /* text-gray-700 */
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.15s ease; /* transition-colors */
  box-sizing: border-box;
  white-space: nowrap;
}

.tab-group-dropdown-menu .dropdown-item:hover {
  background-color: #f9fafb; /* hover:bg-gray-50 */
  color: var(--color-primary-hover); /* hover:text-primary-hover */
}

.tab-group-dropdown-menu .dropdown-item.active {
  background-color: #f9fafb; /* bg-gray-50 */
  color: var(--color-primary-hover); /* text-primary-hover */
}

/* Dark mode dropdown items */
[data-theme='dark'] .tab-group-dropdown-menu .dropdown-item {
  color: var(--text-primary);
}

[data-theme='dark'] .tab-group-dropdown-menu .dropdown-item:hover,
[data-theme='dark'] .tab-group-dropdown-menu .dropdown-item.active {
  background-color: var(--bg-hover);
  color: var(--color-primary);
}

/* Group color indicator dot */
.dropdown-color-dot {
  width: 8px; /* w-2 */
  height: 8px; /* h-2 */
  border-radius: 9999px; /* rounded-full */
  flex-shrink: 0;
}

.dropdown-color-dot.bg-gray-400 {
  background-color: #9ca3af;
}

.dropdown-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* ========== 底部栏 ========== */
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-color-light);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

/* Footer Buttons - Modern Design */
.footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-1);
  padding: 0 var(--spacing-3);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-lg);
  transition: all var(--transition-fast);
  white-space: nowrap;
  height: var(--button-height-md);
  box-sizing: border-box;
  cursor: pointer;
  border: none;
}

.footer-btn svg {
  width: 16px;
  height: 16px;
}

/* Primary Button - Solid, Modern */
.footer-btn.primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: var(--shadow-button);
}

.footer-btn.primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: var(--shadow-button-hover);
  transform: translateY(-1px);
}

.footer-btn.primary:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: var(--shadow-button);
}

.footer-btn.primary.large {
  flex: 1;
}

/* Secondary Button - Outlined, Modern */
.footer-btn.secondary {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-xs);
  flex: 1;
}

.footer-btn.secondary:hover {
  background-color: var(--bg-secondary);
  border-color: var(--color-primary-200);
}

.footer-btn.ghost {
  background-color: transparent;
  color: var(--text-secondary);
  border: none;
}

.footer-btn.ghost:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.footer-btn.danger {
  background-color: transparent;
  color: var(--color-error);
  border: none;
}

.footer-btn.danger:hover:not(:disabled) {
  background-color: var(--color-error-light);
}

.footer-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* ========== 底部操作栏 (Action Bar) ========== */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  padding: 0 var(--spacing-md);
  background-color: white;
  border-top: 1px solid var(--border-color-light);
  flex-shrink: 0;
  box-sizing: border-box;
}

/* 左侧：选择控制区 */
.action-bar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.action-bar-left .select-info {
  font-size: var(--font-size-sm);
  color: var(--text-gray-600, #757575);
  white-space: nowrap;
}

.action-bar-left .select-link {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.action-bar-left .select-link:hover {
  color: var(--color-primary-hover);
  text-decoration: underline;
}

/* 右侧：功能按钮区 */
.action-bar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

/* 删除按钮 */
.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.delete-btn svg {
  width: 14px;
  height: 14px;
}

.delete-btn:hover:not(:disabled) {
  color: var(--color-error);
  background-color: var(--color-error-light);
}

.delete-btn:disabled {
  cursor: not-allowed;
  color: var(--text-gray-400, #a0a0a0);
}

/* ========== 导出按钮 (统一描边风格) ========== */
.export-dropdown-container {
  position: relative;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  box-sizing: border-box;
}

.export-btn svg:first-child {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.export-btn svg:last-child {
  width: 10px;
  height: 10px;
  color: var(--text-secondary);
}

.export-btn:hover:not(:disabled) {
  background-color: var(--bg-hover);
}

.export-btn.disabled {
  cursor: not-allowed;
  background-color: var(--bg-gray-100, #f5f5f5);
  color: var(--text-gray-400, #a0a0a0);
  border-color: var(--bg-gray-200, #eeeeee);
}

.export-btn.disabled:hover {
  background-color: var(--bg-gray-100, #f5f5f5);
}

/* 导出下拉菜单 */
.export-dropdown-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background-color: white;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 140px;
  overflow: hidden;
  z-index: 100;
}

.export-dropdown-menu .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 12px;
  height: 34px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.export-dropdown-menu .dropdown-item:hover {
  background-color: var(--bg-hover);
}

.dropdown-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  opacity: 0.7;
}

/* ========== 移动按钮 (统一描边风格) ========== */
.move-dropdown {
  position: relative;
}

.move-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  box-sizing: border-box;
}

.move-btn svg {
  width: 14px;
  height: 14px;
}

.move-btn:hover {
  background-color: var(--bg-hover);
}

.move-btn.disabled {
  cursor: not-allowed;
  background-color: var(--bg-gray-100, #f5f5f5);
  color: var(--text-gray-400, #a0a0a0);
  border-color: var(--bg-gray-200, #eeeeee);
}

.move-btn.disabled:hover {
  background-color: var(--bg-gray-100, #f5f5f5);
}

/* 分组下拉菜单 */
.group-dropdown-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background-color: white;
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 120px;
  overflow: hidden;
  z-index: 100;
}

.group-dropdown-menu .dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 12px;
  height: 34px;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-sizing: border-box;
}

.group-dropdown-menu .dropdown-item:hover {
  background-color: var(--bg-hover);
}

.group-dropdown-menu .dropdown-item.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
}

/* ========== 弹窗 ========== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 320px;
  max-width: 90%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color-light);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.modal-close {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.modal-close svg {
  width: 16px;
  height: 16px;
}

.modal-body {
  padding: var(--spacing-lg);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color-light);
}

/* 删除确认弹窗文本 */
.delete-warning {
  font-size: var(--font-size-md);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm);
}

.delete-warning strong {
  color: var(--color-error);
}

.delete-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  padding: var(--spacing-sm);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
}

/* ========== 现代化弹窗样式 (Notion/Linear 风格) ========== */
.modern-modal {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 360px;
  max-width: 90%;
  overflow: hidden;
}

.modern-modal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) var(--spacing-lg) 0;
  border-bottom: none;
}

.modern-modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #1f2937;
}

.modern-modal-body {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  width: 100%;
  box-sizing: border-box;
}

.modern-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  border-top: none;
  width: 100%;
  box-sizing: border-box;
}

.modern-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  background-color: #f9fafb;
  border: 1px solid transparent;
  border-radius: 6px;
  color: #111827;
  transition: all 0.2s ease;
}

.modern-input::placeholder {
  color: #9ca3af;
}

.modern-input:focus {
  outline: none;
  background-color: #ffffff;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--theme-primary-500), 0.1);
}

.modern-color-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  width: 100%;
  margin-top: var(--spacing-md);
  box-sizing: border-box;
}

.color-option {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.color-check {
  width: 14px;
  height: 14px;
  color: white;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ========== 清单模式选择器 ========== */
.modal-list-create {
  max-width: 420px;
}

.list-mode-selector {
  margin-top: 16px;
}

.mode-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 10px;
}

[data-theme='dark'] .mode-label {
  color: #9ca3af;
}

.mode-cards {
  display: flex;
  gap: 12px;
}

.mode-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

[data-theme='dark'] .mode-card {
  background-color: #1f2937;
  border-color: #374151;
}

.mode-card:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

[data-theme='dark'] .mode-card:hover {
  border-color: #4b5563;
  background-color: #374151;
}

.mode-card.active {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

[data-theme='dark'] .mode-card.active {
  border-color: #3b82f6;
  background-color: #1e3a5f;
}

/* Action Mode - Green accent */
.mode-card.active:has(.mode-icon-action) {
  border-color: #22c55e;
  background-color: #f0fdf4;
}

[data-theme='dark'] .mode-card.active:has(.mode-icon-action) {
  border-color: #22c55e;
  background-color: #14532d;
}

/* Buffer Mode - Blue accent */
.mode-card.active:has(.mode-icon-buffer) {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

[data-theme='dark'] .mode-card.active:has(.mode-icon-buffer) {
  border-color: #3b82f6;
  background-color: #1e3a5f;
}

.mode-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  flex-shrink: 0;
}

.mode-icon-action {
  background-color: #dcfce7;
  color: #22c55e;
}

[data-theme='dark'] .mode-icon-action {
  background-color: #14532d;
  color: #4ade80;
}

.mode-icon-buffer {
  background-color: #dbeafe;
  color: #3b82f6;
}

[data-theme='dark'] .mode-icon-buffer {
  background-color: #1e3a5f;
  color: #60a5fa;
}

.mode-card-icon svg {
  width: 20px;
  height: 20px;
}

.mode-card-content {
  flex: 1;
  min-width: 0;
}

.mode-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

[data-theme='dark'] .mode-card-title {
  color: #f3f4f6;
}

.mode-card-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.3;
}

[data-theme='dark'] .mode-card-desc {
  color: #9ca3af;
}

.modern-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  height: 36px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modern-btn svg {
  width: 16px;
  height: 16px;
}

.modern-btn.primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.modern-btn.primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.modern-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modern-btn.secondary {
  background-color: transparent;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.modern-btn.secondary:hover {
  background-color: #f9fafb;
}

/* ========== 表单 ========== */
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-sm);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.color-picker {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  width: 100%;
  margin-top: var(--spacing-md);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

/* ========== 按钮 ========== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn svg {
  width: 16px;
  height: 16px;
}

.btn.primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.btn.primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn.secondary {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn.secondary:hover {
  background-color: var(--bg-hover);
}

.btn.danger {
  background-color: var(--color-error);
  color: white;
  border: none;
}

.btn.danger:hover:not(:disabled) {
  background-color: #d32f2f;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== Tab菜单 ========== */
.tab-menu {
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 180px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.menu-item:hover {
  background-color: var(--bg-hover);
}

.menu-item svg {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}

.menu-item.danger {
  color: var(--color-error);
}

.menu-item.danger svg {
  color: var(--color-error);
}

.menu-group {
  padding: var(--spacing-xs) 0;
}

.menu-label {
  padding: var(--spacing-xs) var(--spacing-md);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.menu-divider {
  height: 1px;
  background-color: var(--border-color-light);
  margin: var(--spacing-sm) 0;
}

/* ========== 暗色模式适配 ========== */
[data-theme='dark'] .app-title {
  color: var(--text-primary);
}

[data-theme='dark'] .brand-logo-mini {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: var(--shadow-button);
}

[data-theme='dark'] .search-input {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
}

[data-theme='dark'] .search-input:hover {
  background-color: var(--bg-tertiary);
}

[data-theme='dark'] .search-input:focus {
  background-color: var(--bg-primary);
}

[data-theme='dark'] .unified-toolbar {
  background-color: var(--bg-primary);
}

[data-theme='dark'] .toolbar-divider {
  background-color: var(--border-color);
}

[data-theme='dark'] .group-tab-divider {
  background-color: var(--border-color);
}

[data-theme='dark'] .group-tab-inline {
  color: var(--text-secondary);
}

[data-theme='dark'] .group-tab-inline:hover {
  background-color: var(--bg-hover);
}

[data-theme='dark'] .group-tab-inline.active {
  background-color: var(--color-primary-light);
}

[data-theme='dark'] .add-list-btn {
  background-color: transparent;
  border-color: var(--border-color);
}

[data-theme='dark'] .add-list-btn:hover {
  background-color: var(--color-primary-light);
  border-color: var(--color-primary-200);
}

[data-theme='dark'] .tab-item {
  background-color: var(--bg-primary);
}

[data-theme='dark'] .tab-item:hover {
  background-color: var(--bg-secondary);
}

[data-theme='dark'] .tab-favicon-placeholder {
  background-color: var(--bg-tertiary);
}
</style>
