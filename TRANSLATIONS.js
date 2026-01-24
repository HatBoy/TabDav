/**
 * Comprehensive Localization Object for TabDav
 * 9 Languages: zh-CN, zh-TW, en, es, pt, ja, de, fr, ru
 *
 * IMPORTANT:
 * - "TabDav" brand name is NEVER translated
 * - "TabDav - Tab Manager & Sync" toolbar title is NEVER translated
 */

const TRANSLATIONS = {
  'zh-CN': {
    app: {
      name: 'TabDav',
      title: 'TabDav - Tab Manager & Sync',
    },
    common: {
      save: '保存',
      cancel: '取消',
      delete: '删除',
      confirm: '确认',
      loading: '加载中...',
      syncing: '同步中...',
      synced: '已同步',
      pending: '待同步',
      error: '错误',
      success: '成功',
      failed: '失败',
      all: '全部',
      none: '无',
      close: '关闭',
      settings: '设置',
    },
    popup: {
      title: 'TabDav',
      tabsCount: '{{count}} 个标签',
      pendingSync: '{{count}} 待同步',
      syncTooltip: '同步数据',
      syncTooltipSyncing: '同步中...',
      settingsTooltip: '设置',
      searchPlaceholder: '搜索标签...',
      groupAll: '全部',
      noTabs: '暂无收藏内容',
      emptySubtitle: '点击下方按钮，将当前网页保存到这里',
      collectCurrent: '收藏本页',
      batchManage: '批量管理',
      collectAll: '收藏全部',
