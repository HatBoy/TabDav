<template>
  <!-- 1. Global Page Wrapper -->
  <div class="page-wrapper" :data-theme="settings.theme">
    <!-- 2. Centered Constraint Wrapper -->
    <div class="centered-container">
      <!-- 3. Sticky Sidebar -->
      <aside class="sticky-sidebar">
        <!-- Sidebar Header - Horizontal Layout + Premium Gradient Icon -->
        <div class="sidebar-header">
          <!-- Premium Icon Container (Gradient & Shadow) -->
          <div class="brand-logo">
            <!-- Outlined Bookmark SVG -->
            <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <!-- Brand Title -->
          <h1 class="page-title">TabDav</h1>
        </div>

        <!-- Navigation Menu -->
        <nav class="sidebar-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            :class="['nav-button', { active: activeSection === item.id }]"
            @click="scrollToSection(item.id)"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.iconPath" />
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 4. Scrollable Content (Native Scroll) -->
      <main class="main-content">
        <div class="content-flow">
        <!-- WebDav配置 Card -->
        <section id="webdav" class="settings-section-wrapper">
        <section class="settings-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-container">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
                  />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h2 class="card-title">{{ $t('options.sections.webdav.title') }}</h2>
            </div>
            <span class="card-badge manual-save">{{ $t('options.manualSave') }}</span>
          </div>
        <div class="card-body">
        <!-- Form Grid Layout -->
        <div class="webdav-form-grid">
          <!-- Server URL: Full Width -->
          <div class="form-group-full">
            <label class="form-label" for="webdav-url">
              {{ $t('options.sections.webdav.url') }}
            </label>
            <input
              id="webdav-url"
              v-model="settings.webdav.url"
              type="url"
              :placeholder="$t('options.sections.webdav.urlPlaceholder')"
              :class="['form-input-modern', { 'input-error': errors.url }]"
              @input="clearError('url')"
            />
            <span v-if="errors.url" class="form-error">{{ errors.url }}</span>
            <span v-else class="form-hint">{{ $t('options.sections.webdav.urlHint') }}</span>
          </div>

          <!-- Username & Password: Side by Side -->
          <div class="form-group-half">
            <label class="form-label" for="webdav-username">
              {{ $t('options.sections.webdav.username') }}
            </label>
            <input
              id="webdav-username"
              v-model="settings.webdav.username"
              type="text"
              :placeholder="$t('options.sections.webdav.usernamePlaceholder')"
              :class="['form-input-modern', { 'input-error': errors.username }]"
              @input="clearError('username')"
            />
            <span v-if="errors.username" class="form-error">{{ errors.username }}</span>
          </div>

          <div class="form-group-half">
            <label class="form-label" for="webdav-password">
              {{ $t('options.sections.webdav.password') }}
            </label>
            <div class="password-input-wrapper">
              <input
                id="webdav-password"
                v-model="settings.webdav.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="$t('options.sections.webdav.passwordPlaceholder')"
                :class="['form-input-modern has-toggle', { 'input-error': errors.password }]"
                @input="clearError('password')"
              />
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </button>
            </div>
            <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
          </div>
        </div>

        <!-- Unified Status Alert (Test & Sync use same UI) -->
        <div v-if="unifiedStatus" :class="['status-alert', unifiedStatus.type === 'success' ? 'status-success' : 'status-error']">
          <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline v-if="unifiedStatus.type === 'success'" points="20 6 9 17 4 12" />
            <circle v-else cx="12" cy="12" r="10" />
            <line v-if="unifiedStatus.type === 'error'" x1="12" y1="8" x2="12" y2="12" />
            <line v-if="unifiedStatus.type === 'error'" x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span class="status-message" v-html="unifiedStatus.message"></span>
        </div>

        <!-- Footer Action Panel -->
        <div class="card-footer">
          <div class="footer-actions">
            <button
              class="btn-modern btn-secondary"
              :disabled="testing"
              @click="testConnection"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {{ testing ? $t('options.sections.webdav.testing') : $t('options.sections.webdav.testConnection') }}
            </button>
            <button
              class="btn-modern btn-secondary"
              :disabled="syncing"
              @click="doSync"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {{ syncing ? $t('options.sections.webdav.syncing') : $t('options.sections.webdav.syncNow') }}
            </button>
            <button
              :class="['btn-modern', 'btn-primary']"
              :disabled="saving"
              @click="saveSettingsWithValidation"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {{ saving ? $t('options.sections.webdav.saving') : $t('options.sections.webdav.saveSettings') }}
            </button>
          </div>
        </div>
        </div>
      </section>
      </section>

      <!-- 同步设置 Card -->
      <section id="sync" class="settings-section-wrapper">
        <section class="settings-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-container">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </div>
              <h2 class="card-title">{{ $t('options.sections.sync.title') }}</h2>
            </div>
          </div>
        <div class="card-body">
        <!-- Premium Toggle List with Dividers -->
        <div class="settings-list">
          <!-- Auto Sync Toggle -->
          <label class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-title">{{ $t('options.sections.sync.autoSync') }}</span>
              <span class="settings-row-desc">{{ $t('options.sections.sync.autoSyncDesc') }}</span>
            </div>
            <div class="toggle-switch">
              <input v-model="settings.sync.autoSyncEnabled" type="checkbox" />
              <span class="toggle-slider"></span>
            </div>
          </label>

          <!-- Nested Sync Interval (shows when auto-sync is enabled) -->
          <div v-if="settings.sync.autoSyncEnabled" class="settings-row settings-row-nested">
            <div class="settings-row-info">
              <span class="settings-row-title">{{ $t('options.sections.sync.syncInterval') }}</span>
              <span class="settings-row-desc">{{ $t('options.sections.sync.syncIntervalDesc') }}</span>
            </div>
            <select v-model="settings.sync.autoSyncInterval" class="form-select-modern">
              <option :value="5">{{ $t('options.sections.sync.syncIntervalOptions.5') }}</option>
              <option :value="10">{{ $t('options.sections.sync.syncIntervalOptions.10') }}</option>
              <option :value="15">{{ $t('options.sections.sync.syncIntervalOptions.15') }}</option>
              <option :value="30">{{ $t('options.sections.sync.syncIntervalOptions.30') }}</option>
              <option :value="60">{{ $t('options.sections.sync.syncIntervalOptions.60') }}</option>
            </select>
          </div>

          <!-- Sync on Startup Toggle -->
          <label class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-title">{{ $t('options.sections.sync.syncOnStartup') }}</span>
              <span class="settings-row-desc">{{ $t('options.sections.sync.syncOnStartupDesc') }}</span>
            </div>
            <div class="toggle-switch">
              <input v-model="settings.sync.syncOnStartup" type="checkbox" />
              <span class="toggle-slider"></span>
            </div>
          </label>
        </div>
        </div>
      </section>
      </section>

      <!-- 功能设置 Card -->
      <section id="features" class="settings-section-wrapper">
        <section class="settings-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-container">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>
              <h2 class="card-title">{{ $t('options.sections.features.title') }}</h2>
            </div>
          </div>
        <div class="card-body">
        <!-- Premium Toggle List with Dividers -->
        <div class="settings-list">
          <!-- Close After Collect -->
          <label class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-title">{{
                $t('options.sections.features.closeAfterCollect')
              }}</span>
              <span class="settings-row-desc">{{
                $t('options.sections.features.closeAfterCollectDesc')
              }}</span>
            </div>
            <div class="toggle-switch">
              <input v-model="settings.closeAfterCollect" type="checkbox" />
              <span class="toggle-slider"></span>
            </div>
          </label>

          <!-- Show Unsynced Badge -->
          <label class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-title">{{
                $t('options.sections.features.showUnsyncedBadge')
              }}</span>
              <span class="settings-row-desc">{{
                $t('options.sections.features.showUnsyncedBadgeDesc')
              }}</span>
            </div>
            <div class="toggle-switch">
              <input v-model="settings.showUnsyncedBadge" type="checkbox" />
              <span class="toggle-slider"></span>
            </div>
          </label>

          <!-- Confirm Single Delete -->
          <label class="settings-row">
            <div class="settings-row-info">
              <span class="settings-row-title">{{
                $t('options.sections.features.confirmSingleDelete')
              }}</span>
              <span class="settings-row-desc">{{
                $t('options.sections.features.confirmSingleDeleteDesc')
              }}</span>
            </div>
            <div class="toggle-switch">
              <input v-model="settings.confirmSingleDelete" type="checkbox" />
              <span class="toggle-slider"></span>
            </div>
          </label>
        </div>
        </div>
      </section>
      </section>

      <!-- 主题设置 Card -->
      <section id="appearance" class="settings-section-wrapper">
        <section class="settings-card">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-container">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                  <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                  <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.25-.813-.63-1.063-.16-.25-.38-.438-.625-.5-.22-.062-.484-.094-.75-.094-.47 0-.89.188-1.188.47-.413.407-.75.97-.75 1.688 0 .984-.015 1.876-.062 2.688h2.094c.062-.812.062-1.704.062-2.688 0-.718.337-1.28.75-1.688-.438-.562-.47-1.25-.47-2.062 0-.813.47-1.485 1.063-1.876.5-.312 1.156-.25 1.875-.062V6h-.094C14.062 3.703 12 2 12 2z"/>
                </svg>
              </div>
              <h2 class="card-title">{{ $t('options.sections.appearance.themeSettings') }}</h2>
            </div>
          </div>
        <div class="card-body">
        <!-- Color Picker Section -->
        <div class="color-picker-section">
          <h3 class="color-picker-title">{{ $t('options.sections.appearance.brandColor') }}</h3>
          <p class="color-picker-desc">{{ $t('options.sections.appearance.brandColorDesc') }}</p>

          <!-- Color Swatches -->
          <div class="color-swatches">
            <button
              v-for="theme in colorThemes"
              :key="theme.id"
              class="color-swatch"
              :class="{ 'color-swatch-active': accentColor === theme.id, [theme.ringClass]: accentColor === theme.id }"
              @click="setTheme(theme.id)"
              :title="theme.name"
            >
              <span :class="['color-circle', theme.colorClass]"></span>
              <span class="color-name">{{ theme.name }}</span>
            </button>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="color-preview-section">
          <h3 class="color-preview-title">{{ $t('options.sections.appearance.previewTitle') }}</h3>
          <div class="preview-buttons">
            <button class="preview-btn preview-btn-primary" :style="previewButtonStyle">
              {{ $t('options.sections.appearance.previewPrimaryButton') }}
            </button>
            <button class="preview-btn preview-btn-outline" :style="{ borderColor: previewButtonStyle.backgroundColor, color: previewButtonStyle.backgroundColor }">
              {{ $t('options.sections.appearance.previewOutlineButton') }}
            </button>
          </div>
        </div>
        </div>
      </section>
      </section>

      <!-- 语言设置 Card -->
      <section id="language" class="settings-section-wrapper">
        <section class="settings-card settings-card-with-dropdown">
          <div class="card-header">
            <div class="card-header-left">
              <div class="card-icon-container">
                <svg class="card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path
                    d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                  />
                </svg>
              </div>
              <h2 class="card-title">{{ $t('options.sections.language.title') }}</h2>
            </div>
          </div>
        <div class="card-body">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ $t('options.sections.language.language') }}</span>
            <span class="setting-desc">{{ $t('options.sections.language.languageDesc') }}</span>
          </div>
          <!-- Custom Language Dropdown -->
          <div class="custom-language-dropdown" ref="languageDropdownRef">
            <button
              type="button"
              class="dropdown-trigger"
              :class="{ 'dropdown-trigger-open': isLanguageDropdownOpen }"
              @click="toggleLanguageDropdown"
            >
              <span class="dropdown-content">
                <span class="dropdown-flag">{{ currentLanguageFlag }}</span>
                <span class="dropdown-label">{{ currentLanguageLabel }}</span>
              </span>
              <svg class="dropdown-chevron" :class="{ 'dropdown-chevron-rotated': isLanguageDropdownOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <Transition name="dropdown-fade">
              <div v-if="isLanguageDropdownOpen" class="dropdown-menu">
                <div
                  v-for="lang in languageOptions"
                  :key="lang.value"
                  class="dropdown-item"
                  :class="{ 'dropdown-item-selected': settings.language === lang.value }"
                  @click="selectLanguage(lang.value)"
                >
                  <span class="dropdown-item-content">
                    <span class="dropdown-item-flag">{{ lang.flag }}</span>
                    <span class="dropdown-item-label">{{ lang.label }}</span>
                  </span>
                  <svg v-if="settings.language === lang.value" class="dropdown-item-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
            </Transition>
          </div>
        </div>
        </div>
      </section>
      </section>

      <!-- 数据管理 Card -->
      <section id="data" class="settings-section-wrapper">
        <section class="settings-card settings-card-data">
          <!-- Enhanced Header with Icon & Subtitle -->
          <div class="card-header card-header-data">
            <div class="card-header-left-data">
              <div class="card-icon-container-data">
                <!-- Database Icon -->
                <svg class="card-icon-data" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div class="card-title-group">
                <h2 class="card-title">{{ $t('options.sections.data.title') }}</h2>
                <p class="card-subtitle">{{ $t('options.sections.data.subtitle') }}</p>
              </div>
            </div>
          </div>
        <div class="card-body">
        <!-- Action Buttons - Redesigned -->
        <div class="data-actions-new">
          <!-- Safe Actions Group -->
          <div class="data-actions-safe">
            <button class="btn-data-new btn-data-export" @click="exportData">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {{ $t('options.sections.data.export') }}
            </button>
            <button class="btn-data-new btn-data-import" @click="importData">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {{ $t('options.sections.data.import') }}
            </button>
          </div>
          <!-- Danger Action -->
          <button class="btn-data-new btn-data-clear" @click="clearData">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ $t('options.sections.data.clearData') }}
          </button>
        </div>
        </div>
      </section>
      </section>

      <!-- 快捷键 Card -->
      <section id="shortcuts" class="settings-section-wrapper">
        <section class="settings-card settings-card-shortcuts">
          <!-- Enhanced Header with Keyboard Icon & Subtitle -->
          <div class="card-header card-header-shortcuts">
            <div class="card-header-left-shortcuts">
              <div class="card-icon-container-shortcuts">
                <!-- Keyboard/Command Icon -->
                <svg class="card-icon-shortcuts" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01" />
                  <path d="M10 8h.01" />
                  <path d="M14 8h.01" />
                  <path d="M18 8h.01" />
                  <path d="M6 12h.01" />
                  <path d="M10 12h.01" />
                  <path d="M14 12h.01" />
                  <path d="M18 12h.01" />
                </svg>
              </div>
              <div class="card-title-group">
                <h2 class="card-title">{{ $t('options.sections.shortcuts.title') }}</h2>
                <p class="card-subtitle">{{ $t('options.sections.shortcuts.subtitle') }}</p>
              </div>
            </div>
          </div>
        <div class="card-body">
        <!-- Shortcut List with Premium Keyboard Cap Style -->
        <div class="shortcut-list-new">
          <!-- Shortcut Item 1 -->
          <div class="shortcut-item-new">
            <span class="shortcut-label">{{ $t('options.sections.shortcuts.collectCurrent') }}</span>
            <div class="shortcut-keys">
              <kbd class="kbd-key">Alt</kbd>
              <span class="kbd-plus">+</span>
              <kbd class="kbd-key">Shift</kbd>
              <span class="kbd-plus">+</span>
              <kbd class="kbd-key">S</kbd>
            </div>
          </div>

          <!-- Shortcut Item 2 -->
          <div class="shortcut-item-new">
            <span class="shortcut-label">{{ $t('options.sections.shortcuts.collectAll') }}</span>
            <div class="shortcut-keys">
              <kbd class="kbd-key">Alt</kbd>
              <span class="kbd-plus">+</span>
              <kbd class="kbd-key">Shift</kbd>
              <span class="kbd-plus">+</span>
              <kbd class="kbd-key">Q</kbd>
            </div>
          </div>

          <!-- Shortcut Item 3 - Open Popup -->
          <div class="shortcut-item-new">
            <span class="shortcut-label">{{ $t('options.sections.shortcuts.openPopup') }}</span>
            <div class="shortcut-keys">
              <kbd class="kbd-key">Alt</kbd>
              <span class="kbd-plus">+</span>
              <kbd class="kbd-key">Q</kbd>
            </div>
          </div>
        </div>

        <!-- Footer: Custom Shortcuts Link -->
        <div class="shortcuts-footer">
          <button type="button" @click="handleOpenShortcuts" class="shortcuts-customize-btn">
            <span>{{ $t('options.sections.shortcuts.customize') }}</span>
            <svg class="shortcuts-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
        </div>
      </section>
      </section>

      <!-- 关于 Card - Brand Identity -->
      <section id="about" class="settings-section-wrapper">
        <section class="settings-card settings-card-brand">
          <div class="card-body card-body-brand">
            <!-- 1. Large Logo -->
            <div class="brand-logo">
              <svg class="brand-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>

            <!-- 2. Title & Version Badge -->
            <div class="brand-title">
              <h2 class="brand-name">TabDav</h2>
              <span class="brand-version">v1.0.0</span>
            </div>

            <!-- 3. Slogan -->
            <p class="brand-slogan">{{ $t('options.sections.about.slogan') }}</p>

            <!-- 4. Description -->
            <p class="brand-description">
              {{ $t('options.sections.about.description') }}
            </p>

            <!-- 5. Action Buttons -->
            <div class="brand-actions">
              <button type="button" @click="openGitHub" class="brand-action-btn">
                <svg class="brand-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>{{ $t('options.sections.about.github') }}</span>
              </button>
              <button type="button" @click="openIssues" class="brand-action-btn">
                <svg class="brand-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{{ $t('options.sections.about.feedback') }}</span>
              </button>
            </div>

            <!-- 6. Footer with Author & Copyright -->
            <div class="brand-footer">
              <p class="brand-author">
                {{ $t('options.sections.about.madeWith') }} <span class="heart">❤️</span> {{ $t('options.sections.about.by') }}
                <a href="https://github.com/HatBoy" target="_blank" rel="noopener noreferrer" class="brand-author-link">HatBoy</a>
              </p>
              <p class="brand-copyright">{{ $t('options.sections.about.copyright') }}</p>
            </div>
          </div>
        </section>
      </section>
        </div>
      </main>
    </div>
  </div>

  <!-- Custom Modal -->
  <teleport to="body">
    <div v-if="modal.show" class="modal-overlay animate-fade-in">
      <div class="modal-container animate-scale-in">
        <!-- Icon -->
        <div
          :class="[
            'modal-icon-wrapper',
            modal.type === 'confirm' ? 'modal-icon-danger' : 'modal-icon-success'
          ]"
        >
          <svg v-if="modal.type === 'confirm'" class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else-if="modal.type === 'success'" class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else class="modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <!-- Title & Message -->
        <h3 class="modal-title">{{ modal.title }}</h3>
        <p v-if="modal.message" class="modal-message">{{ modal.message }}</p>

        <!-- Buttons -->
        <div class="modal-actions">
          <button
            v-if="modal.type === 'confirm'"
            type="button"
            class="modal-btn modal-btn-cancel"
            @click="closeModal"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            :class="[
              'modal-btn',
              modal.type === 'confirm' ? 'modal-btn-danger' : 'modal-btn-primary'
            ]"
            @click="handleModalConfirm"
          >
            {{ modal.type === 'confirm' ? $t('common.confirmClear') : $t('common.ok') }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue';
import { MESSAGE_TYPES } from '../common/constants';
import { DEFAULT_SETTINGS } from '../common/types/settings';
import type { UserSettings } from '../common/types/settings';
import { themeManager } from '../common/services/themeService';
import { LANGUAGE_OPTIONS, localeState } from '../common/i18n';
import { t } from '../common/i18n';
import { useTheme, setupThemeSync } from '../common/theme';

const settings = reactive<UserSettings>(DEFAULT_SETTINGS);
const languageOptions = LANGUAGE_OPTIONS;

// Custom Language Dropdown State
const isLanguageDropdownOpen = ref(false);
const languageDropdownRef = ref<HTMLElement | null>(null);

// Computed properties for current language display
const currentLanguageLabel = computed(() => {
  const current = languageOptions.find(lang => lang.value === settings.language);
  return current?.label || languageOptions[0].label;
});

const currentLanguageFlag = computed(() => {
  const current = languageOptions.find(lang => lang.value === settings.language);
  return current?.flag || languageOptions[0].flag;
});

// Toggle dropdown
function toggleLanguageDropdown() {
  isLanguageDropdownOpen.value = !isLanguageDropdownOpen.value;
}

// Select language
async function selectLanguage(value: string) {
  settings.language = value;
  isLanguageDropdownOpen.value = false;
  // 立即切换语言
  await localeState.setLocale(value as any);
}

// Click outside handler
function handleClickOutside(event: MouseEvent) {
  if (languageDropdownRef.value && !languageDropdownRef.value.contains(event.target as Node)) {
    isLanguageDropdownOpen.value = false;
  }
}

const testing = ref(false);
const syncing = ref(false);
const saving = ref(false);
const showPassword = ref(false); // 密码可见性状态
// Initialize theme system
const { currentTheme: accentColor, setTheme, initTheme, allThemes } = useTheme();
const testResult = ref<{ success: boolean; message: string } | null>(null);
const syncResult = ref<{
  success: boolean;
  uploaded: number;
  downloaded: number;
  deleted: number;
  conflicts: number;
  error?: string;
} | null>(null);

// Modal State
const modal = ref<{
  show: boolean;
  type: 'success' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
}>({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Inline Validation Errors State
const errors = reactive<{
  url: string;
  username: string;
  password: string;
}>({
  url: '',
  username: '',
  password: '',
});

/**
 * Clear error for a specific field when user starts typing
 */
function clearError(field: 'url' | 'username' | 'password'): void {
  errors[field] = '';
}

/**
 * Show Modal
 */
function showModal(config: {
  type: 'success' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
}): void {
  modal.value = { show: true, ...config };
}

/**
 * Close Modal
 */
function closeModal(): void {
  modal.value.show = false;
}

/**
 * Handle Modal Confirm Button Click
 */
function handleModalConfirm(): void {
  if (modal.value.onConfirm) {
    modal.value.onConfirm();
  }
  // Always close modal after handling confirm
  closeModal();
}

/**
 * Unified Status (Combines testResult and syncResult into single display)
 */
const unifiedStatus = computed(() => {
  // Priority: Show most recent result
  // Sync result takes priority if it exists (more recent action)
  if (syncResult.value) {
    if (syncResult.value.success) {
      const { uploaded, downloaded, conflicts } = syncResult.value;
      let message = `${t('options.sections.webdav.syncSuccess')} `;
      const parts: string[] = [];
      parts.push(`${t('options.sections.webdav.upload')} <strong>${uploaded}</strong>`);
      parts.push(`${t('options.sections.webdav.download')} <strong>${downloaded}</strong>`);
      if (conflicts > 0) {
        parts.push(`${t('options.sections.webdav.conflicts')} <strong>${conflicts}</strong>`);
      }
      message += `(${parts.join(', ')})`;
      return { type: 'success' as const, message };
    } else {
      return {
        type: 'error' as const,
        message: syncResult.value.error || t('options.sections.webdav.syncFailed'),
      };
    }
  }

  // Fall back to test result
  if (testResult.value) {
    return {
      type: testResult.value.success ? ('success' as const) : ('error' as const),
      message: testResult.value.message,
    };
  }

  return null;
});

// Sidebar Navigation State
const activeSection = ref('webdav');

// Navigation Items Configuration
const navItems = computed(() => {
  // 依赖 localeState.locale 以确保语言切换时重新计算
  const _ = localeState.locale;
  return [
  {
    id: 'webdav',
    label: t('options.sections.webdav.title'),
    icon: 'svg',
    iconPath: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />',
  },
  {
    id: 'sync',
    label: t('options.sections.sync.title'),
    icon: 'svg',
    iconPath: '<polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />',
  },
  {
    id: 'features',
    label: t('options.sections.features.title'),
    icon: 'svg',
    iconPath: '<polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />',
  },
  {
    id: 'appearance',
    label: t('options.sections.appearance.themeSettings'),
    icon: 'svg',
    iconPath: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.25-.813-.63-1.063-.16-.25-.38-.438-.625-.5-.22-.062-.484-.094-.75-.094-.47 0-.89.188-1.188.47-.413.407-.75.97-.75 1.688 0 .984-.015 1.876-.062 2.688h2.094c.062-.812.062-1.704.062-2.688 0-.718.337-1.28.75-1.688-.438-.562-.47-1.25-.47-2.062 0-.813.47-1.485 1.063-1.876.5-.312 1.156-.25 1.875-.062V6h-.094C14.062 3.703 12 2 12 2z"/>',
  },
  {
    id: 'language',
    label: t('options.sections.language.title'),
    icon: 'svg',
    iconPath: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
  },
  {
    id: 'data',
    label: t('options.sections.data.title'),
    icon: 'svg',
    iconPath: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />',
  },
  {
    id: 'shortcuts',
    label: t('options.sections.shortcuts.title'),
    icon: 'svg',
    iconPath: '<rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" /><path d="M6 12h.01" /><path d="M10 12h.01" /><path d="M14 12h.01" /><path d="M18 12h.01" />',
  },
  {
    id: 'about',
    label: t('options.sections.about.title'),
    icon: 'svg',
    iconPath: '<circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />',
  },
];
});

// Color Theme Options - using theme data from themeConfig (now includes colorClass and ringClass)
const colorThemes = computed(() => {
  // 依赖 localeState.locale 以确保语言切换时重新计算
  const _ = localeState.locale;
  return Object.values(allThemes).map(theme => ({
    id: theme.id,
    name: t(`options.sections.appearance.colors.${theme.id}`),
    colorClass: theme.colorClass, // Use the colorClass from themeConfig
    ringClass: theme.ringClass,   // Use the ringClass from themeConfig
  }));
});

// Computed property for dynamic button style based on selected color
const previewButtonStyle = computed(() => {
  const colorMap: Record<string, string> = {
    blue: 'rgb(59 130 246)',
    indigo: 'rgb(99 102 241)',
    violet: 'rgb(139 92 246)',
    fuchsia: 'rgb(217 70 239)',
    rose: 'rgb(244 63 94)',
    orange: 'rgb(249 115 22)',
    amber: 'rgb(245 158 11)',
    emerald: 'rgb(16 185 129)',
    slate: 'rgb(100 116 139)',
  };
  return {
    backgroundColor: colorMap[accentColor.value] || colorMap.blue,
  };
});

/**
 * Scroll to section
 */
function scrollToSection(id: string): void {
  activeSection.value = id;
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// 保存初始设置副本，用于检测变化
let initialSettings: UserSettings | null = null;

// 自动保存的字段列表
const AUTO_SAVE_FIELDS = [
  'sync.autoSyncEnabled',
  'sync.autoSyncInterval',
  'sync.syncOnStartup',
  'closeAfterCollect',
  'showUnsyncedBadge',
  'confirmSingleDelete',
  'theme',
  'language',
  'notificationsEnabled',
];

/**
 * 检测设置是否有自动保存的字段发生变化
 */
function hasAutoSaveFieldChanged(newSettings: UserSettings, oldSettings: UserSettings): boolean {
  return AUTO_SAVE_FIELDS.some(field => {
    const keys = field.split('.');
    let newVal: unknown = newSettings;
    let oldVal: unknown = oldSettings;
    for (const key of keys) {
      newVal = (newVal as Record<string, unknown>)[key];
      oldVal = (oldVal as Record<string, unknown>)[key];
    }
    return newVal !== oldVal;
  });
}

/**
 * 保存设置（通用）
 */
async function saveSettingsInternal(manual: boolean = false): Promise<boolean> {
  try {
    const plainSettings = JSON.parse(JSON.stringify(settings));
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SETTINGS_SAVE,
      payload: plainSettings,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 手动保存（用于服务器配置）
 */
async function saveSettings(): Promise<void> {
  saving.value = true;

  try {
    const success = await saveSettingsInternal(true);
    if (success) {
      testResult.value = { success: true, message: t('toast.settingsSaved') };

      // 提示用户可能需要重启自动同步
      if (settings.sync.autoSyncEnabled) {
        testResult.value.message = t('toast.settingsSavedWithSync');
      }
    } else {
      testResult.value = { success: false, message: t('toast.settingsSaveFailed') };
    }
  } finally {
    saving.value = false;
  }
}

/**
 * 保存设置（带内联验证）
 */
async function saveSettingsWithValidation(): Promise<void> {
  // Clear previous errors
  errors.url = '';
  errors.username = '';
  errors.password = '';

  // Inline validation
  let hasErrors = false;

  // Validate URL
  if (!settings.webdav.url) {
    errors.url = t('validation.urlRequired');
    hasErrors = true;
  } else {
    try {
      new URL(settings.webdav.url);
    } catch {
      errors.url = t('validation.urlInvalid');
      hasErrors = true;
    }
  }

  // Validate username
  if (!settings.webdav.username) {
    errors.username = t('validation.usernameRequired');
    hasErrors = true;
  }

  // Validate password
  if (!settings.webdav.password) {
    errors.password = t('validation.passwordRequired');
    hasErrors = true;
  }

  if (hasErrors) {
    return;
  }

  // If validation passes, proceed with save
  saving.value = true;

  try {
    const success = await saveSettingsInternal(true);
    if (success) {
      testResult.value = { success: true, message: t('toast.settingsSaved') };

      // 提示用户可能需要重启自动同步
      if (settings.sync.autoSyncEnabled) {
        testResult.value.message = t('toast.settingsSavedWithSync');
      }
    } else {
      testResult.value = { success: false, message: t('toast.settingsSaveFailed') };
    }
  } finally {
    saving.value = false;
  }
}

/**
 * 自动保存（用于功能/外观设置）- Instant Save
 */
async function autoSaveSettings(): Promise<void> {
  if (!initialSettings) return;

  // 检查是否有自动保存的字段变化
  if (!hasAutoSaveFieldChanged(settings, initialSettings)) {
    return;
  }

  // Instant save - no loading state, no toast
  const success = await saveSettingsInternal(false);
  if (success) {
    // 更新初始副本
    initialSettings = JSON.parse(JSON.stringify(settings));
  }
}

// 监听主题变化，实时应用
watch(
  () => settings.theme,
  newTheme => {
    themeManager.setTheme(newTheme);
  }
);

// 监听语言变化，实时应用
watch(
  () => settings.language,
  async newLanguage => {
    const { setLocale } = await import('../common/i18n');
    await setLocale(newLanguage as any);
    // 通知 Service Worker 更新语言
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.SETTINGS_LANGUAGE_UPDATE,
      payload: { language: newLanguage },
    });
  }
);

onMounted(async () => {
  const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SETTINGS_GET });
  if (response.success) {
    Object.assign(settings, response.data);
    // 保存初始副本，用于检测变化
    initialSettings = JSON.parse(JSON.stringify(settings));
  }
  // 初始化语言
  const { setLocale } = await import('../common/i18n');
  await setLocale(settings.language as any);

  // Initialize theme system
  await initTheme();
  // Setup theme sync across extension pages
  setupThemeSync();

  // Add click outside listener for language dropdown
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  // Remove click outside listener
  document.removeEventListener('click', handleClickOutside);
});

// 监听设置变化，自动保存
watch(
  () => settings,
  () => {
    if (initialSettings) {
      autoSaveSettings();
    }
  },
  { deep: true }
);

async function testConnection(): Promise<void> {
  testing.value = true;
  testResult.value = null;
  syncResult.value = null; // Clear sync result to show only test result

  // Clear previous errors and validate inline
  errors.url = '';
  errors.username = '';
  errors.password = '';

  // Validate and set inline errors
  let hasErrors = false;

  if (!settings.webdav.url) {
    errors.url = t('validation.urlRequired');
    hasErrors = true;
  } else {
    try {
      new URL(settings.webdav.url);
    } catch {
      errors.url = t('validation.urlInvalid');
      hasErrors = true;
    }
  }

  if (!settings.webdav.username) {
    errors.username = t('validation.usernameRequired');
    hasErrors = true;
  }

  if (!settings.webdav.password) {
    errors.password = t('validation.passwordRequired');
    hasErrors = true;
  }

  if (hasErrors) {
    testing.value = false;
    return;
  }

  // If all fields are present, proceed with connection test
  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SYNC_TEST });
    const result = (response as any).data;
    if (result && result.success) {
      testResult.value = { success: true, message: t('testConnection.success') };
    } else {
      testResult.value = {
        success: false,
        message: result?.message || t('testConnection.failed'),
      };
    }
  } catch (error) {
    console.error(t('testConnection.exception') + ':', error);
    testResult.value = { success: false, message: t('testConnection.error') };
  } finally {
    testing.value = false;
  }
}

async function doSync(): Promise<void> {
  syncing.value = true;
  testResult.value = null;
  syncResult.value = null;

  try {
    const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.SYNC_REQUEST });
    const result = (response as any).data;

    if (result.success) {
      syncResult.value = {
        success: true,
        uploaded: result.uploaded || 0,
        downloaded: result.downloaded || 0,
        deleted: result.deleted || 0,
        conflicts: result.conflicts || 0,
      };
    } else {
      syncResult.value = {
        success: false,
        uploaded: 0,
        downloaded: 0,
        deleted: 0,
        conflicts: 0,
        error: result.error || t('errors.syncFailed'),
      };
    }
  } catch {
    syncResult.value = {
      success: false,
      uploaded: 0,
      downloaded: 0,
      deleted: 0,
      conflicts: 0,
      error: t('errors.syncFailed'),
    };
  } finally {
    syncing.value = false;
  }
}

function exportData(): void {
  chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DATA_EXPORT }, (response: any) => {
    if (response && response.success && response.data) {
      const exportData = response.data;
      // 验证返回数据格式（Map格式：Record<string, T>）
      if (
        exportData.tabs &&
        typeof exportData.tabs === 'object' &&
        !Array.isArray(exportData.tabs) &&
        exportData.groups &&
        typeof exportData.groups === 'object' &&
        !Array.isArray(exportData.groups)
      ) {
        const data = JSON.stringify(exportData, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TabDav_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        showModal({
          type: 'error',
          title: t('errors.exportInvalidFormat'),
          message: '',
        });
      }
    } else {
      showModal({
        type: 'error',
        title: t('errors.exportFailedWithError', { error: response?.error || t('errors.unknown') }),
        message: '',
      });
    }
  });
}

function importData(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async e => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const data = JSON.parse(event.target?.result as string);

          // 验证数据格式（支持Map格式：Record<string, T>）
          if (
            !data.tabs ||
            typeof data.tabs !== 'object' ||
            !data.groups ||
            typeof data.groups !== 'object'
          ) {
            showModal({
              type: 'error',
              title: t('errors.importInvalidFormat'),
              message: '',
            });
            return;
          }

          // 发送数据到 background 进行导入
          const response = await chrome.runtime.sendMessage({
            type: MESSAGE_TYPES.DATA_IMPORT,
            payload: data,
          });

          if (response && response.success) {
            // Build import success message from counts
            const parts: string[] = [];
            const data = response.data;

            if (data?.tabsAdded > 0) {
              parts.push(t('dataOperation.tabsAdded', { count: data.tabsAdded }));
            }
            if (data?.groupsAdded > 0) {
              parts.push(t('dataOperation.groupsAdded', { count: data.groupsAdded }));
            }
            if (data?.orphanedTabsFixed > 0) {
              parts.push(t('dataOperation.orphanedTabsFixed', { count: data.orphanedTabsFixed }));
            }

            const detailMessage = parts.length > 0 ? parts.join(', ') : t('dataOperation.noDataToImport');

            showModal({
              type: 'success',
              title: t('dataOperation.importSuccess') + ' ' + detailMessage,
              message: '',
              onConfirm: () => {
                window.location.reload();
              },
            });
          } else {
            showModal({
              type: 'error',
              title: t('errors.importFailedWithError', {
                error: response?.data?.message || response?.error || t('errors.unknown'),
              }),
              message: '',
            });
          }
        } catch {
          showModal({
            type: 'error',
            title: t('errors.importCheckJsonFormat'),
            message: '',
          });
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function clearData(): void {
  showModal({
    type: 'confirm',
    title: t('options.sections.data.clearConfirmTitle'),
    message: t('options.sections.data.clearConfirmMessage'),
    onConfirm: () => {
      chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DATA_CLEAR }, (response: any) => {
        if (response && response.success) {
          // Small delay to allow modal animation to complete before reload
          setTimeout(() => {
            window.location.reload();
          }, 100);
        } else {
          showModal({
            type: 'error',
            title: t('errors.clearFailedWithError', { error: response?.error || t('errors.unknown') }),
            message: '',
          });
        }
      });
    },
  });
}

// Open shortcuts customization page with browser detection
function handleOpenShortcuts(): void {
  // Detect browser: Chrome vs Edge
  const isEdge = navigator.userAgent.includes('Edg');
  const shortcutsUrl = isEdge ? 'edge://extensions/shortcuts' : 'chrome://extensions/shortcuts';

  // Use chrome.tabs.create API for safe navigation
  // This is the only way to bypass security restrictions
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url: shortcutsUrl });
  } else {
    // Fallback for development environments
    alert(`Please open the following URL in your browser:\n\n${shortcutsUrl}`);
  }
}

function openGitHub(): void {
  chrome.tabs.create({ url: 'https://github.com/HatBoy/TabDav' });
}

function openIssues(): void {
  chrome.tabs.create({ url: 'https://github.com/HatBoy/TabDav/issues' });
}
</script>

<style scoped>
/* ============================================
   CENTERED CONTAINER WITH STICKY SIDEBAR LAYOUT
   ============================================ */

/* 1. Global Page Wrapper */
.page-wrapper {
  min-height: 100vh;
  background-color: #f9fafb;
}

/* 2. Centered Constraint Wrapper */
.centered-container {
  max-width: 72rem; /* max-w-6xl */
  margin-left: auto;
  margin-right: auto;
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
}

/* 3. Sticky Sidebar */
.sticky-sidebar {
  width: 16rem; /* w-64 */
  flex-shrink: 0;
  border-right: 1px solid #f3f4f6;
  background-color: rgba(249, 250, 251, 0.5);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  padding-top: 2rem;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
}

/* Sidebar Header - Horizontal Layout + Premium Gradient Icon */
.sticky-sidebar .sidebar-header {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Premium Icon Container (Gradient & Shadow) */
.brand-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(var(--theme-primary-500), 0.2);
  flex-shrink: 0;
}

.brand-logo .brand-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #ffffff;
}

/* Brand Title - Bold & Compact */
.sticky-sidebar .page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.025em;
  line-height: 1;
}

/* Sidebar Navigation */
.sticky-sidebar .sidebar-nav {
  padding-left: 1rem;
  padding-right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem; /* py-3 px-4 - larger vertical padding */
  font-size: 1rem; /* text-base - larger font size */
  font-weight: 500; /* font-medium */
  color: #4b5563; /* text-gray-600 */
  background: transparent;
  border: none;
  border-radius: 0.5rem; /* rounded-lg */
  cursor: pointer;
  transition: all 0.2s ease-in-out; /* duration-200 */
}

.nav-button:hover {
  color: #111827; /* hover:text-gray-900 */
  background-color: #f3f4f6; /* hover:bg-gray-100 */
}

.nav-button.active {
  color: var(--color-primary-hover);
  font-weight: 600; /* font-semibold for active state */
  background-color: var(--color-primary-light);
}

.nav-button .nav-icon {
  width: 1.25rem; /* larger icon for better balance */
  height: 1.25rem;
  flex-shrink: 0;
}

.nav-button .nav-label {
  white-space: nowrap;
}

/* Sidebar Footer */
.sticky-sidebar .sidebar-footer {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 1rem;
  margin-top: auto;
  border-top: 1px solid #f3f4f6;
}

.version-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* 4. Scrollable Content (Native Scroll) */
.main-content {
  flex: 1;
  min-width: 0;
  padding-top: 2.5rem;
  padding-bottom: 2.5rem;
  padding-left: 3rem;
  padding-right: 3rem;
}

.content-flow {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Section Wrappers with scroll margin */
.settings-section-wrapper {
  scroll-margin-top: 2.5rem;
}

/* Content Footer */
.content-footer {
  margin-top: 5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
}

/* ============================================
   MODERN SETTINGS CARD
   ============================================ */

.settings-card {
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

/* Language card needs overflow visible for dropdown and higher z-index */
.settings-card.settings-card-with-dropdown {
  overflow: visible;
  position: relative;
  z-index: 20;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fafbfc;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--color-primary, #2196f3);
  flex-shrink: 0;
}

.card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.card-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
}

.card-badge.manual-save {
  background: #fef3c7;
  color: #d97706;
}

.card-body {
  padding: 1.5rem;
}

/* ============================================
   DARK THEME SUPPORT
   ============================================ */

.page-wrapper[data-theme='dark'] {
  background-color: #111827;
}

.page-wrapper[data-theme='dark'] .sticky-sidebar {
  background-color: rgba(31, 41, 55, 0.5);
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .page-title {
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .brand-logo {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  box-shadow: 0 4px 6px -1px rgba(var(--theme-primary-500), 0.3);
}

.page-wrapper[data-theme='dark'] .nav-button {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .nav-button:hover {
  color: #f9fafb;
  background-color: #374151;
}

.page-wrapper[data-theme='dark'] .nav-button.active {
  color: var(--color-primary);
  background-color: rgba(var(--theme-primary-500), 0.2);
}

.page-wrapper[data-theme='dark'] .sidebar-footer {
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .version-text {
  color: #6b7280;
}

.page-wrapper[data-theme='dark'] .content-footer {
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .footer-text {
  color: #6b7280;
}

/* Dark theme support for settings card */
.page-wrapper[data-theme='dark'] .settings-card {
  background: #1f2937;
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .card-header {
  background: #1f2937;
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .card-title {
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .card-body {
  background: #1f2937;
}

/* Toast 提示 */
.toast {
  position: fixed;
  top: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  z-index: 1000;
  animation: toast-fade-in 0.3s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.toast.success {
  background-color: var(--color-success);
  color: white;
}

.toast.error {
  background-color: var(--color-error);
  color: white;
}

@keyframes toast-fade-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* ============================================
   MODERN WEBDAV FORM STYLES
   ============================================ */

/* Form Grid Layout */
.webdav-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group-full {
  grid-column: 1 / -1;
}

.form-group-half {
  display: flex;
  flex-direction: column;
}

/* Modern Form Labels */
.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

/* Modern Input Fields */
.form-input-modern {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #111827;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-input-modern:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-500), 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.form-input-modern::placeholder {
  color: #9ca3af;
}

.form-input-modern.has-toggle {
  padding-right: 2.5rem;
}

/* Password Input Wrapper */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
}

.password-toggle {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s ease-in-out;
}

.password-toggle:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.password-toggle svg {
  width: 1.125rem;
  height: 1.125rem;
}

/* Form Hint */
.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Modern Action Buttons */
.form-actions-modern {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-modern {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-modern svg {
  width: 1rem;
  height: 1rem;
}

/* Primary Button - Save Settings */
.btn-modern.btn-primary {
  background-color: var(--color-primary);
  color: #ffffff;
  border: 1px solid transparent;
}

.btn-modern.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
  box-shadow: 0 4px 6px -1px rgba(var(--theme-primary-500), 0.2);
}

.btn-modern.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Secondary Button - Test Connection & Sync Now */
.btn-modern.btn-secondary {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-modern.btn-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-modern.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============================================
   INLINE VALIDATION & STATUS ALERTS
   ============================================ */

/* Input Error State */
.form-input-modern.input-error {
  border-color: #fca5a5;
  background-color: #fef2f2;
}

.form-input-modern.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Form Error Text */
.form-error {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #ef4444;
}

/* Status Alert (For Connection Test Results) */
.status-alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.status-alert .status-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.status-alert .status-message {
  flex: 1;
}

.status-alert .status-message strong {
  font-weight: 600;
}

.status-alert.status-success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.status-alert.status-error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

/* ============================================
   CARD FOOTER (Action Panel)
   ============================================ */

.card-footer {
  background-color: #f9fafb;
  border-top: 1px solid #f3f4f6;
  border-radius: 0 0 0.75rem 0.75rem;
  margin: 1.5rem -1.5rem -1.5rem -1.5rem;
  padding: 1rem 1.5rem;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* Saved Button State */
.btn-modern.btn-saved {
  background-color: #16a34a;
  color: #ffffff;
  border-color: transparent;
}

.btn-modern.btn-saved:hover:not(:disabled) {
  background-color: #15803d;
  box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);
}

/* Dark Theme Support */
.page-wrapper[data-theme='dark'] .form-input-modern.input-error {
  border-color: #f87171;
  background-color: rgba(248, 113, 113, 0.1);
}

.page-wrapper[data-theme='dark'] .form-input-modern.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
}

.page-wrapper[data-theme='dark'] .form-error {
  color: #f87171;
}

.page-wrapper[data-theme='dark'] .status-alert.status-success {
  background-color: rgba(22, 163, 74, 0.1);
  color: #4ade80;
  border-color: rgba(74, 222, 128, 0.3);
}

.page-wrapper[data-theme='dark'] .status-alert.status-error {
  background-color: rgba(248, 113, 113, 0.1);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}

.page-wrapper[data-theme='dark'] .card-footer {
  background-color: #1f2937;
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .btn-modern.btn-saved {
  background-color: #16a34a;
}

/* Dark Theme Support for Modern Form */
.page-wrapper[data-theme='dark'] .form-label {
  color: #d1d5db;
}

.page-wrapper[data-theme='dark'] .form-input-modern {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .form-input-modern:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-500), 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.3);
}

.page-wrapper[data-theme='dark'] .form-input-modern::placeholder {
  color: #6b7280;
}

.page-wrapper[data-theme='dark'] .form-hint {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .password-toggle {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .password-toggle:hover {
  background-color: #374151;
  color: #d1d5db;
}

.page-wrapper[data-theme='dark'] .btn-modern.btn-secondary {
  background-color: #1f2937;
  color: #d1d5db;
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .btn-modern.btn-secondary:hover:not(:disabled) {
  background-color: #374151;
  border-color: #4b5563;
}

/* 表单样式 (Legacy - for other cards) */
.form-group {
  margin-bottom: var(--spacing-md);
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
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.form-hint {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.form-row {
  display: flex;
  gap: var(--spacing-md);
}

.form-row .form-group {
  flex: 1;
}

.form-select {
  width: auto;
  min-width: 120px;
  height: 36px;
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-sm);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  flex-shrink: 0;
}

.form-select.language-select {
  min-width: 160px;
}

/* ============================================
   CUSTOM LANGUAGE DROPDOWN STYLES
   ============================================ */

.custom-language-dropdown {
  position: relative;
  flex-shrink: 0;
}

/* Dropdown Trigger Button */
.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 180px;
  height: 40px;
  padding: 0 0.875rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  flex-shrink: 0;
}

.dropdown-trigger:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

.dropdown-trigger:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-500), 0.1);
}

.dropdown-trigger-open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-500), 0.1);
}

.dropdown-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-flag {
  font-size: 1.125rem;
  line-height: 1;
}

.dropdown-label {
  font-weight: 500;
  color: #374151;
}

.dropdown-chevron {
  width: 1rem;
  height: 1rem;
  color: #9ca3af;
  transition: transform 0.2s ease-in-out;
  flex-shrink: 0;
}

.dropdown-chevron-rotated {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 200px;
  max-width: 280px;
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  border: 1px solid #f3f4f6;
  padding: 0.25rem;
  z-index: 50;
  max-height: 320px;
  overflow-y: auto;
}

/* Dropdown Item */
.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.1s ease-in-out;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.dropdown-item-selected {
  background-color: #eff6ff;
}

.dropdown-item-selected .dropdown-item-label {
  color: var(--color-primary-hover);
  font-weight: 500;
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.dropdown-item-flag {
  font-size: 1rem;
  line-height: 1;
}

.dropdown-item-label {
  font-size: 0.875rem;
  color: #374151;
}

.dropdown-item-check {
  width: 1rem;
  height: 1rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

/* Dropdown Fade Animation */
.dropdown-fade-enter-active {
  animation: dropdownFadeIn 0.15s ease-out;
}

.dropdown-fade-leave-active {
  animation: dropdownFadeOut 0.1s ease-in;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes dropdownFadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-4px);
  }
}

/* Dark mode support */
[data-theme='dark'] .dropdown-trigger {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

[data-theme='dark'] .dropdown-trigger:hover {
  background-color: #374151;
  border-color: #4b5563;
}

[data-theme='dark'] .dropdown-label,
[data-theme='dark'] .dropdown-item-label {
  color: #f9fafb;
}

[data-theme='dark'] .dropdown-menu {
  background-color: #1f2937;
  border-color: #374151;
}

[data-theme='dark'] .dropdown-item:hover {
  background-color: #374151;
}

[data-theme='dark'] .dropdown-item-selected {
  background-color: rgba(var(--theme-primary-500), 0.2);
}

.form-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}

.test-result {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
}

.test-result.success {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.test-result.error {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

/* 同步结果样式 */
.sync-result {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.sync-result.success {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.sync-result.error {
  background-color: var(--color-error-light);
  color: var(--color-error);
}

.sync-summary {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-sm);
}

.sync-stat {
  font-size: var(--font-size-sm);
}

.sync-stat strong {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.sync-message {
  margin: 0;
  font-size: var(--font-size-sm);
}

/* 开关样式 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-color-light);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.setting-desc {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-tertiary);
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
}

.switch-slider::before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: var(--radius-full);
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.switch input:checked + .switch-slider {
  background-color: var(--color-primary);
}

.switch input:checked + .switch-slider::before {
  transform: translateX(20px);
}

/* 主题选择器 */
.theme-selector {
  display: flex;
  gap: var(--spacing-sm);
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--bg-secondary);
  border: 2px solid var(--border-color-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-option input {
  display: none;
}

.theme-option svg {
  width: 20px;
  height: 20px;
  color: var(--text-secondary);
}

.theme-option span {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.theme-option:hover {
  border-color: var(--border-color);
}

.theme-option.active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.theme-option.active svg,
.theme-option.active span {
  color: var(--color-primary);
}

/* 按钮样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
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

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.btn.danger:hover {
  background-color: #e53935;
}

/* 数据操作 */
.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

/* ============================================
   SHORTCUTS CARD - Premium Keyboard Cap Style
   ============================================ */

/* Shortcuts Card Header */
.card-header-shortcuts {
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fafbfc;
}

.card-header-left-shortcuts {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.card-icon-container-shortcuts {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  border-radius: 0.5rem;
  background-color: var(--color-primary-light);
  flex-shrink: 0;
}

.card-icon-shortcuts {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary-hover);
}

/* New Shortcut List with Premium Keyboard Cap Style */
.shortcut-list-new {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.shortcut-item-new {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.75rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s ease-in-out;
}

.shortcut-item-new:last-child {
  border-bottom: none;
}

.shortcut-item-new:hover {
  background-color: #f9fafb;
  margin: 0 -0.75rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  border-radius: 0.375rem;
}

.shortcut-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

/* Keyboard Keys Container */
.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

/* Premium Keyboard Cap Style */
.kbd-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  color: #4b5563;
  background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%);
  border: 1px solid #d1d5db;
  border-bottom-width: 2px;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  user-select: none;
}

.kbd-plus {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

/* Shortcuts Footer */
.shortcuts-footer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.shortcuts-customize-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--color-primary-hover);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease-in-out;
}

.shortcuts-customize-btn:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.shortcuts-link-icon {
  width: 0.875rem;
  height: 0.875rem;
}

/* Dark mode support */
[data-theme='dark'] .card-header-shortcuts {
  background: #1f2937;
  border-color: #374151;
}

[data-theme='dark'] .card-icon-container-shortcuts {
  background-color: rgba(var(--theme-primary-500), 0.2);
}

[data-theme='dark'] .shortcut-item-new {
  border-color: #374151;
}

[data-theme='dark'] .shortcut-item-new:hover {
  background-color: #374151;
}

[data-theme='dark'] .shortcut-label {
  color: #f9fafb;
}

[data-theme='dark'] .kbd-key {
  background: linear-gradient(to bottom, #1f2937 0%, #111827 100%);
  border-color: #374151;
  color: #d1d5db;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

[data-theme='dark'] .kbd-plus {
  color: #6b7280;
}

[data-theme='dark'] .shortcuts-footer {
  border-color: #374151;
}

[data-theme='dark'] .shortcuts-customize-btn:hover {
  color: var(--color-primary);
}

/* ============================================
   BRAND IDENTITY CARD (About)
   ============================================ */

/* Special card styling for brand identity */
.settings-card-brand {
  background: linear-gradient(to bottom, #ffffff 0%, #fafafa 100%);
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1);
}

[data-theme='dark'] .settings-card-brand {
  background: linear-gradient(to bottom, #1f2937 0%, #111827 100%);
  border-color: #374151;
}

.card-body-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 2rem;
}

/* 1. Large Logo */
.card-body-brand .brand-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(to bottom right, rgb(var(--theme-primary-500)), rgb(var(--theme-primary-600)));
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px -5px rgba(var(--theme-primary-500), 0.3);
  margin-bottom: 1.5rem;
}

.card-body-brand .brand-logo-icon {
  width: 40px;
  height: 40px;
  color: #ffffff;
  stroke-width: 1.75;
}

/* 2. Title & Version Badge */
.brand-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.brand-version {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background-color: #f3f4f6;
  color: #4b5563;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

/* 3. Slogan */
.brand-slogan {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.75rem 0;
}

/* 4. Description */
.brand-description {
  font-size: 0.875rem;
  color: #6b7280;
  max-width: 28rem;
  margin: 0 auto 1.5rem auto;
  line-height: 1.75;
}

/* 5. Action Buttons */
.brand-actions {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.brand-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background-color: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 0.625rem;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.brand-action-btn:hover {
  background-color: #f9fafb;
  border-color: rgb(var(--theme-primary-500));
  color: rgb(var(--theme-primary-600));
}

.brand-action-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
}

/* 6. Footer */
.brand-footer {
  border-top: 1px solid #f3f4f6;
  padding-top: 1.25rem;
  width: 100%;
}

.brand-author {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
}

.brand-author-link {
  font-weight: 500;
  color: #374151;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-decoration-color: #d1d5db;
  text-underline-offset: 2px;
  transition: color 0.2s ease, text-decoration-color 0.2s ease;
}

.brand-author-link:hover {
  color: rgb(var(--theme-primary-600));
  text-decoration-color: rgb(var(--theme-primary-600));
}

.brand-copyright {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
}

/* Heart animation */
.heart {
  display: inline-block;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Dark mode support */
[data-theme='dark'] .brand-name {
  color: #f9fafb;
}

[data-theme='dark'] .brand-version {
  background-color: #374151;
  color: #d1d5db;
}

[data-theme='dark'] .brand-slogan {
  color: #f9fafb;
}

[data-theme='dark'] .brand-description {
  color: #9ca3af;
}

[data-theme='dark'] .brand-action-btn {
  border-color: #374151;
  color: #d1d5db;
}

[data-theme='dark'] .brand-action-btn:hover {
  background-color: #374151;
  border-color: rgb(var(--theme-primary-500));
  color: rgb(var(--theme-primary-500));
}

[data-theme='dark'] .brand-footer {
  border-color: #374151;
}

[data-theme='dark'] .brand-author {
  color: #9ca3af;
}

[data-theme='dark'] .brand-author-link {
  color: #d1d5db;
  text-decoration-color: #4b5563;
}

[data-theme='dark'] .brand-author-link:hover {
  color: rgb(var(--theme-primary-500));
  text-decoration-color: rgb(var(--theme-primary-500));
}

[data-theme='dark'] .brand-copyright {
  color: #6b7280;
}

/* ============================================
   MODERN TOGGLE SWITCH
   ============================================ */

.setting-item-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item-modern:last-child {
  border-bottom: none;
}

.setting-item-nested {
  padding-left: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
  border-bottom: none !important;
}

.setting-info-modern {
  flex: 1;
  padding-right: 1rem;
}

.setting-label-modern {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.setting-desc-modern {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
  line-height: 1.4;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 2.75rem;
  height: 1.5rem;
  flex-shrink: 0;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  border-radius: 9999px;
  transition: all 0.2s ease-in-out;
}

.toggle-slider::before {
  position: absolute;
  content: '';
  height: 1.25rem;
  width: 1.25rem;
  left: 0.125rem;
  bottom: 0.125rem;
  background-color: #ffffff;
  border-radius: 9999px;
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(1.25rem);
}

/* Modern Form Select */
.form-select-modern {
  width: auto;
  min-width: 140px;
  height: 2.375rem;
  padding: 0 0.75rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  color: #111827;
}

.form-select-modern:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-500), 0.1);
}

/* ============================================
   PREMIUM SETTINGS LIST (Clickable Rows with Dividers)
   ============================================ */

/* Settings List Container with Dividers */
.settings-list {
  display: flex;
  flex-direction: column;
  divide-y: divide-gray-100;
  margin: 0 -1.5rem; /* Negative margin for full-width hover */
}

/* Premium Settings Row - Clickable Full Width */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  margin: 0; /* Override negative margin */
}

.settings-row:hover {
  background-color: #f9fafb;
}

/* Nested Row (for sync interval - not clickable) */
.settings-row.settings-row-nested {
  cursor: default;
  background-color: #f9fafb;
  padding-left: 2.5rem;
}

.settings-row.settings-row-nested:hover {
  background-color: #f9fafb;
}

/* Settings Row Info (Text Area) */
.settings-row-info {
  flex: 1;
  padding-right: 1rem;
}

/* Settings Row Title */
.settings-row-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  line-height: 1.4;
}

/* Settings Row Description */
.settings-row-desc {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  line-height: 1.4;
}

/* ============================================
   COLOR PICKER (Theme Accent Color Selection)
   ============================================ */

/* Color Picker Section */
.color-picker-section {
  margin-bottom: 2rem;
}

.color-picker-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.25rem;
}

.color-picker-desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

/* Color Swatches Container */
.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

/* Color Swatch Button */
.color-swatch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.color-swatch:hover {
  background-color: #f9fafb;
}

.color-swatch:hover .color-circle {
  transform: scale(1.1);
}

/* Color Circle */
.color-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  transition: transform 0.15s ease-in-out;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

/* Selected State with Ring */
.color-swatch-active {
  background-color: #f9fafb;
}

.color-swatch-active .color-circle {
  box-shadow: 0 0 0 4px #ffffff, 0 0 0 6px currentColor;
}

/* Color Name Label */
.color-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}

/* Color Classes - Static classes for all 9 theme colors */
.bg-blue-600 { background-color: #2563eb; }
.bg-indigo-600 { background-color: #4f46e5; }
.bg-violet-600 { background-color: #7c3aed; }
.bg-fuchsia-500 { background-color: #d946ef; }
.bg-rose-500 { background-color: #f43f5e; }
.bg-orange-500 { background-color: #f97316; }
.bg-amber-500 { background-color: #f59e0b; }
.bg-emerald-500 { background-color: #10b981; }
.bg-slate-600 { background-color: #475569; }

/* Ring Classes (for selected state ring-color) */
.ring-blue-600 { --tw-ring-color: #2563eb; }
.ring-indigo-600 { --tw-ring-color: #4f46e5; }
.ring-violet-600 { --tw-ring-color: #7c3aed; }
.ring-fuchsia-500 { --tw-ring-color: #d946ef; }
.ring-rose-500 { --tw-ring-color: #f43f5e; }
.ring-orange-500 { --tw-ring-color: #f97316; }
.ring-amber-500 { --tw-ring-color: #f59e0b; }
.ring-emerald-500 { --tw-ring-color: #10b981; }
.ring-slate-600 { --tw-ring-color: #475569; }

/* ============================================
   PREVIEW SECTION
   ============================================ */

/* Preview Section */
.color-preview-section {
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.color-preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
}

/* Preview Buttons */
.preview-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.preview-btn {
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.preview-btn-primary {
  color: #ffffff;
  border: none;
}

.preview-btn-outline {
  background-color: #ffffff;
  border: 1px solid;
  border-radius: 0.5rem;
}

/* Dark Theme Support */
.page-wrapper[data-theme='dark'] .color-picker-title {
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .color-picker-desc {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .color-swatch:hover {
  background-color: #374151;
}

.page-wrapper[data-theme='dark'] .color-swatch-active {
  background-color: #374151;
}

.page-wrapper[data-theme='dark'] .color-name {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .color-preview-section {
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .color-preview-title {
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .preview-btn-outline {
  background-color: #1f2937;
}

/* ============================================
   MODERN DATA MANAGEMENT BUTTONS (Legacy)
   ============================================ */

.data-actions-modern {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-data {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-data svg {
  width: 1rem;
  height: 1rem;
}

.btn-data-secondary {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-data-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-data-destructive {
  background-color: #ffffff;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-data-destructive:hover {
  background-color: #fef2f2;
  border-color: #fca5a5;
}

/* ============================================
   REDESIGNED DATA MANAGEMENT CARD
   ============================================ */

/* Data Card Header Enhancement */
.card-header-data {
  align-items: flex-start;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  background: #fafbfc;
}

.card-header-left-data {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.card-icon-container-data {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem;
  border-radius: 0.5rem;
  background-color: var(--color-primary-light);
  flex-shrink: 0;
}

.card-icon-data {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary-hover);
}

.card-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-subtitle {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.5;
  color: #6b7280;
  max-width: 480px;
}

/* New Data Actions Layout */
.data-actions-new {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.data-actions-safe {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

/* New Button Styles */
.btn-data-new {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Export Button */
.btn-data-export {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-data-export:hover {
  background-color: #f9fafb;
  color: var(--color-primary-hover);
  border-color: rgba(var(--theme-primary-500), 0.3);
}

/* Import Button */
.btn-data-import {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-data-import:hover {
  background-color: #f9fafb;
  color: var(--color-primary-hover);
  border-color: rgba(var(--theme-primary-500), 0.3);
}

/* Clear Button (Danger) */
.btn-data-clear {
  background-color: #ffffff;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-data-clear:hover {
  background-color: #fef2f2;
  border-color: #fca5a5;
  color: #b91c1c;
}

/* Dark mode support for data card */
[data-theme='dark'] .card-header-data {
  background: #1f2937;
  border-color: #374151;
}

[data-theme='dark'] .card-icon-container-data {
  background-color: rgba(var(--theme-primary-500), 0.2);
}

[data-theme='dark'] .card-subtitle {
  color: #9ca3af;
}

[data-theme='dark'] .btn-data-export,
[data-theme='dark'] .btn-data-import {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

[data-theme='dark'] .btn-data-export:hover,
[data-theme='dark'] .btn-data-import:hover {
  background-color: #374151;
  border-color: var(--color-primary);
}

[data-theme='dark'] .btn-data-clear {
  background-color: #1f2937;
  border-color: #7f1d1d;
  color: #f87171;
}

[data-theme='dark'] .btn-data-clear:hover {
  background-color: #450a0a;
  border-color: #991b1b;
  color: #ef4444;
}

/* ============================================
   PAGE FOOTER
   ============================================ */

.page-footer {
  margin-top: 3rem;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 0.875rem;
  color: #9ca3af;
}

/* ============================================
   DARK THEME SUPPORT
   ============================================ */

.page-wrapper[data-theme='dark'] .setting-item-modern {
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .setting-item-nested {
  background: #374151;
}

.page-wrapper[data-theme='dark'] .setting-label-modern {
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .setting-desc-modern {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .toggle-slider {
  background-color: #4b5563;
}

.page-wrapper[data-theme='dark'] .toggle-slider::before {
  background-color: #f3f4f6;
}

.page-wrapper[data-theme='dark'] .toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

/* Dark Theme Support for Premium Settings Rows */
.page-wrapper[data-theme='dark'] .settings-list {
  divide-color: #374151;
}

.page-wrapper[data-theme='dark'] .settings-row:hover {
  background-color: #374151;
}

.page-wrapper[data-theme='dark'] .settings-row.settings-row-nested {
  background-color: #1f2937;
}

.page-wrapper[data-theme='dark'] .settings-row-title {
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .settings-row-desc {
  color: #9ca3af;
}

.page-wrapper[data-theme='dark'] .form-select-modern {
  background-color: #1f2937;
  border-color: #374151;
  color: #f9fafb;
}

.page-wrapper[data-theme='dark'] .form-select-modern:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--theme-primary-500), 0.2);
}

.page-wrapper[data-theme='dark'] .theme-card {
  background-color: #1f2937;
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .theme-card:hover {
  border-color: #4b5563;
}

.page-wrapper[data-theme='dark'] .theme-card.selected {
  border-color: var(--color-primary);
  background-color: rgba(var(--theme-primary-500), 0.2);
}

.page-wrapper[data-theme='dark'] .btn-data-secondary {
  background-color: #1f2937;
  color: #d1d5db;
  border-color: #374151;
}

.page-wrapper[data-theme='dark'] .btn-data-secondary:hover {
  background-color: #374151;
  border-color: #4b5563;
}

.page-wrapper[data-theme='dark'] .btn-data-destructive {
  background-color: #1f2937;
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}

.page-wrapper[data-theme='dark'] .btn-data-destructive:hover {
  background-color: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.5);
}

.page-wrapper[data-theme='dark'] .footer-text {
  color: #6b7280;
}

/* ============================================
   MICRO-IMPROVEMENTS
   ============================================ */

/* Icon Container with Depth */
.card-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-right: 0.75rem;
  background-color: var(--color-primary-light);
  color: var(--color-primary-hover);
}

.card-icon-container.card-icon-danger {
  background-color: #fef2f2;
  color: #dc2626;
}

/* Keyboard Shortcuts - Skeuomorphic Look */
.shortcut-list kbd {
  display: inline-block;
  padding: 0.375rem 0.5rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-bottom-width: 2px;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: #4b5563;
  min-width: 1.5rem;
  text-align: center;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* Save Button Success State */
.btn-modern.btn-success {
  background-color: #16a34a;
  color: #ffffff;
  border-color: transparent;
}

.btn-modern.btn-success:hover:not(:disabled) {
  background-color: #15803d;
}

/* Update Footer Margin */
.page-footer {
  margin-top: 3rem;
  margin-bottom: 1rem;
  text-align: center;
}

/* Dark Theme Support for Micro-Improvements */
.page-wrapper[data-theme='dark'] .card-icon-container {
  background-color: rgba(37, 99, 235, 0.2);
  color: #60a5fa;
}

.page-wrapper[data-theme='dark'] .card-icon-container.card-icon-danger {
  background-color: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.page-wrapper[data-theme='dark'] .shortcut-list kbd {
  background-color: #374151;
  border-color: #4b5563;
  color: #d1d5db;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
}

.page-wrapper[data-theme='dark'] .btn-modern.btn-success {
  background-color: #16a34a;
}

/* ============================================
   CUSTOM MODAL
   ============================================ */

/* Standard animation keyframes (Tailwind-compatible) */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

.modal-overlay.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.modal-container {
  background-color: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 28rem;
  width: 100%;
  padding: 1.5rem;
}

.modal-container.animate-scale-in {
  animation: scale-in 0.2s ease-out;
}

.modal-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem;
  border-radius: 9999px;
}

.modal-icon-success {
  background-color: #dcfce7;
}

.modal-icon-danger {
  background-color: #fee2e2;
}

.modal-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.modal-icon-success .modal-icon {
  color: #16a34a;
}

.modal-icon-danger .modal-icon {
  color: #dc2626;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  text-align: center;
  margin: 0;
}

.modal-message {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.modal-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn-cancel {
  background-color: transparent;
  border: 1px solid #d1d5db;
  color: #374151;
}

.modal-btn-cancel:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.modal-btn-primary {
  background-color: rgb(var(--theme-primary-600));
  border: 1px solid transparent;
  color: #ffffff;
}

.modal-btn-primary:hover {
  background-color: rgb(var(--theme-primary-700));
}

.modal-btn-danger {
  background-color: #dc2626;
  border: 1px solid transparent;
  color: #ffffff;
}

.modal-btn-danger:hover {
  background-color: #b91c1c;
}

/* Dark mode support */
[data-theme='dark'] .modal-container {
  background-color: #1f2937;
}

[data-theme='dark'] .modal-title {
  color: #f9fafb;
}

[data-theme='dark'] .modal-message {
  color: #9ca3af;
}

[data-theme='dark'] .modal-icon-success {
  background-color: rgba(22, 163, 74, 0.2);
}

[data-theme='dark'] .modal-icon-danger {
  background-color: rgba(220, 38, 38, 0.2);
}

[data-theme='dark'] .modal-icon-success .modal-icon {
  color: #22c55e;
}

[data-theme='dark'] .modal-icon-danger .modal-icon {
  color: #ef4444;
}

[data-theme='dark'] .modal-btn-cancel {
  background-color: transparent;
  border-color: #4b5563;
  color: #d1d5db;
}

[data-theme='dark'] .modal-btn-cancel:hover {
  background-color: #374151;
  border-color: #6b7280;
}

</style>
