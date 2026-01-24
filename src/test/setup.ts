/**
 * Vitest 测试设置
 */

import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// 全局 mocks
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    },
    openOptionsPage: vi.fn(),
    lastError: null
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    onUpdated: {
      addListener: vi.fn()
    },
    onRemoved: {
      addListener: vi.fn()
    }
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn(),
    onClicked: {
      addListener: vi.fn()
    }
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn()
    }
  },
  notifications: {
    create: vi.fn()
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    },
    sync: {
      get: vi.fn(),
      set: vi.fn()
    }
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn()
  },
  commands: {
    onCommand: {
      addListener: vi.fn()
    }
  }
};

// 挂载工具
config.global.stubs = {
  $router: { push: vi.fn() }
};
