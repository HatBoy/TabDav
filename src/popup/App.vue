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

    <!-- 分组标签栏 -->
    <div class="group-tabs">
      <button
        :class="['group-tab', { active: !selectedGroupId }]"
        @click="selectedGroupId = undefined"
      >
        {{ $t('popup.groupAll') }} ({{ stats.total }})
      </button>
      <button
        v-for="group in groups"
        :key="group.id"
        :class="['group-tab', { active: selectedGroupId === group.id }]"
        @click="selectedGroupId = group.id"
      >
        <span v-if="group.color" class="group-dot" :style="{ backgroundColor: group.color }"></span>
        <span class="group-name">{{ group.name }}</span>
        <span class="group-count">({{ groupTabCounts[group.id] || 0 }})</span>
        <button
          class="group-delete-btn"
          @click.stop="confirmDeleteGroup(group)"
          :title="$t('popup.group.delete')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </button>
      <button class="group-tab add-group" @click="showCreateGroup = true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
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
        <p class="empty-title">{{ $t('popup.noTabs') }}</p>
        <p class="empty-subtitle">{{ $t('popup.emptySubtitle') }}</p>
      </div>

      <div
        v-for="tab in filteredTabs"
        :key="tab.id"
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
            <template v-if="tab.groupId">
              <span class="meta-separator">·</span>
              <span v-for="group in groups" :key="group.id">
                <span v-if="group.id === tab.groupId" class="tab-group-info">
                  <span
                    v-if="group.color"
                    class="group-dot"
                    :style="{ backgroundColor: group.color }"
                  ></span>
                  <span class="group-name">{{ group.name }}</span>
                </span>
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
          </div>
        </div>
        <!-- 操作按钮（悬停显示） -->
        <div v-if="mode === 'normal'" class="tab-actions">
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
                <span
                  v-if="group.color"
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
        <!-- 导出按钮 -->
        <div class="export-dropdown-container">
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
        <!-- 移动按钮 -->
        <div class="move-dropdown">
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
              <span
                v-if="group.color"
                class="group-dot"
                :style="{ backgroundColor: group.color }"
              ></span>
              {{ group.name }}
            </button>
          </div>
        </div>
      </div>
    </footer>

    <!-- 新建分组弹窗 -->
    <div v-if="showCreateGroup" class="modal-overlay" @click.self="showCreateGroup = false">
      <div class="modal modern-modal">
        <div class="modal-header modern-modal-header">
          <h3 class="modern-modal-title">{{ $t('popup.group.create') }}</h3>
        </div>
        <div class="modal-body modern-modal-body">
          <input
            v-model="newGroupName"
            type="text"
            class="input modern-input"
            maxlength="30"
            :placeholder="$t('popup.group.namePlaceholder')"
            @keyup.enter="createGroup"
          />
          <div class="color-picker modern-color-picker">
            <button
              v-for="color in pastelColors"
              :key="color"
              :class="['color-option modern-color-option', { active: newGroupColor === color }]"
              :style="{ backgroundColor: color }"
              @click="newGroupColor = color"
            >
              <svg
                v-if="newGroupColor === color"
                class="color-check"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
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

    <!-- Toast 通知组件 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { formatRelativeTime, getDomain } from '../common/utils/date';
import { MESSAGE_TYPES } from '../common/constants';
import { GROUP_COLORS } from '../common/types/group';
import type { TabItem } from '../common/types/tab';
import type { Group } from '../common/types/group';
import { themeManager } from '../common/services/themeService';
import { t } from '../common/i18n';
import { initTheme, setupThemeSync } from '../common/theme';
import Toast from './components/Toast.vue';

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
const tabs = ref<TabItem[]>([]);
const groups = ref<Group[]>([]);
const theme = ref<'light' | 'dark' | 'system'>('light');
const mode = ref<'normal' | 'select'>('normal');
const selectedTabIds = ref<string[]>([]);
const showGroupDropdown = ref(false);
const showCreateGroup = ref(false);
const newGroupName = ref('');
const newGroupColor = ref(COLORS[0]); // Default to first color (blue-500)
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
}

// 切换导出模式下拉菜单
function toggleExportDropdown(): void {
  showExportDropdown.value = !showExportDropdown.value;
}

// 计算属性
const isActionDisabled = computed(() => selectedTabIds.value.length === 0);

// 分组标签数量映射
const groupTabCounts = computed(() => {
  const counts: Record<string, number> = {};
  const tabList = tabs.value || [];
  for (const tab of tabList) {
    if (tab && tab.groupId) {
      counts[tab.groupId] = (counts[tab.groupId] || 0) + 1;
    }
  }
  return counts;
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

const filteredTabs = computed(() => {
  const tabList = tabs.value || [];
  let result: TabItem[] = Array.isArray(tabList) ? tabList : [];

  if (selectedGroupId.value) {
    result = result.filter(t => t.groupId === selectedGroupId.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      t => t.title.toLowerCase().includes(query) || t.url.toLowerCase().includes(query)
    );
  }

  result.sort((a, b) => b.createdAt - a.createdAt);
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

// 执行删除（从确认弹窗调用）
async function executeDelete(): Promise<void> {
  if (isBatchDelete.value) {
    // 批量删除
    const ids = selectedTabIds.value;
    tabs.value = tabs.value.filter(t => !ids.includes(t.id));

    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_DELETE,
      payload: { ids },
    });

    exitSelectMode();
  } else if (tabToDelete.value) {
    // 单个删除
    const id = tabToDelete.value.id;
    tabs.value = tabs.value.filter(t => t.id !== id);
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_DELETE,
      payload: { id },
    });
    activeTabGroupDropdown.value = null;
  }

  // 关闭弹窗
  showDeleteTabModal.value = false;
  tabToDelete.value = null;
}

// Tab操作
async function openTab(tab: TabItem | null): Promise<void> {
  if (!tab) return;
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
    tabs.value = tabs.value.filter(t => t.id !== id);
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.TAB_DELETE,
      payload: { id },
    });
    activeTabGroupDropdown.value = null;
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
      payload: { name: newGroupName.value.trim(), color: newGroupColor.value },
    });

    if (response && (response as any).success && (response as any).data) {
      const group = (response as any).data as Group;
      groups.value.push(group);
      newGroupName.value = '';
      newGroupColor.value = COLORS[0]; // Reset to first color (blue-500)
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
  return tabs.value.filter(t => t.groupId === groupId).length;
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
      // 从列表中移除分组
      groups.value = groups.value.filter(g => g.id !== groupToDelete.value!.id);
      // 如果当前选中的分组被删除，重置选中状态
      if (selectedGroupId.value === groupToDelete.value!.id) {
        selectedGroupId.value = undefined;
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
  padding: 0.75rem 1rem; /* px-4 py-3 - compact spacing */
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.625rem; /* ml-2.5 equivalent */
}

/* Premium Brand Logo - Mini Version (w-8 h-8 = 32px) */
.brand-logo-mini {
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px 0 rgba(var(--theme-primary-500), 0.2);
  flex-shrink: 0;
}

.brand-logo-mini svg {
  width: 1.25rem; /* w-5 */
  height: 1.25rem;
  color: #ffffff;
}

.app-title {
  font-size: 1.125rem; /* text-lg */
  font-weight: 700; /* font-bold */
  color: #111827; /* text-gray-900 */
  letter-spacing: -0.025em; /* tracking-tight */
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
  gap: var(--spacing-xs);
}

.header-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.header-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
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

/* 同步角标 */
.sync-badge-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  color: white;
  background-color: var(--color-error);
  border-radius: var(--radius-full);
  z-index: 1;
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
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
}

.search-icon {
  position: absolute;
  left: calc(var(--spacing-lg) + var(--spacing-sm));
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 32px;
  padding: 0 var(--spacing-md) 0 36px;
  font-size: var(--font-size-sm);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.search-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.search-input:disabled {
  background-color: var(--bg-tertiary);
  cursor: not-allowed;
}

/* ========== 分组标签栏 ========== */
.group-tabs {
  display: flex;
  gap: 4px;
  padding: var(--spacing-xs) var(--spacing-sm);
  overflow-x: auto;
  background-color: transparent;
  border-bottom: 1px solid var(--border-color-light);
  flex-shrink: 0;
}

.group-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background-color: transparent;
  border-radius: var(--radius-full);
  white-space: nowrap;
  transition: all var(--transition-fast);
  border: none;
  cursor: pointer;
}

.group-tab:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.group-tab.active {
  background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.group-name {
  flex-shrink: 0;
}

.group-count {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.group-tab.active .group-count {
  color: var(--color-primary);
  opacity: 0.8;
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
  padding: var(--spacing-sm) 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-tertiary);
  text-align: center;
}

.empty-illustration {
  width: 96px;
  height: 96px;
  margin-bottom: var(--spacing-md);
  color: var(--bg-tertiary);
}

.empty-state .empty-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
}

.empty-state .empty-subtitle {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.tab-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  border-bottom: 1px solid var(--border-color-light);
}

.tab-item:last-child {
  border-bottom: none;
}

.tab-item:hover {
  background-color: var(--bg-hover);
}

.tab-item.selected {
  background-color: var(--color-primary-light);
}

.tab-favicon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.tab-favicon-placeholder {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.tab-favicon-placeholder svg {
  width: 12px;
  height: 12px;
  color: var(--text-tertiary);
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 2px;
}

.tab-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tab-meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.tab-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  margin-left: var(--spacing-xs);
}

.sync-status-icon.pending {
  color: var(--text-tertiary);
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

/* 操作按钮 - 默认隐藏，悬停显示 */
.tab-actions {
  display: flex;
  align-items: center;
  gap: 2px;
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
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
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
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: white;
  border-top: 1px solid var(--border-color-light);
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.04);
}

/* 暗色模式下的底部栏背景 */
[data-theme='dark'] .app-footer {
  background-color: var(--bg-primary);
  border-top-color: var(--border-color);
}

/* 暗色模式下的品牌样式 */
[data-theme='dark'] .app-title {
  color: #f9fafb;
}

[data-theme='dark'] .brand-logo-mini {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 1px 3px 0 rgba(var(--theme-primary-500), 0.3);
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  white-space: nowrap;
  height: 36px;
  box-sizing: border-box;
}

.footer-btn svg {
  width: 14px;
  height: 14px;
}

.footer-btn.primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.footer-btn.primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.footer-btn.primary.large {
  flex: 1;
}

.footer-btn.primary.large svg {
  width: 14px;
  height: 14px;
}

.footer-btn.secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  flex: 1;
}

.footer-btn.secondary:hover {
  background-color: var(--bg-hover);
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

/* 暗色模式适配 */
[data-theme='dark'] .tab-item {
  background-color: var(--bg-secondary);
}

[data-theme='dark'] .search-input {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
}

[data-theme='dark'] .search-input:focus {
  background-color: var(--bg-primary);
}
</style>
