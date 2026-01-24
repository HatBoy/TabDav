/**
 * 轻量级 i18n 插件
 * 不依赖 runtime compilation，适合 Chrome 扩展
 */

import type { App } from 'vue';

// 语言列表
export const LOCALES = [
  { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
  { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: '日本語', nativeName: '日本語' },
  { code: 'de', name: 'Deutsch', nativeName: 'Deutsch' },
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'fr', name: 'Français', nativeName: 'Français' },
  { code: 'pt', name: 'Português', nativeName: 'Português' },
  { code: 'ru', name: 'Русский', nativeName: 'Русский' },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

// 语言选项（用于下拉选择）with flags
export const LANGUAGE_OPTIONS = [
  { label: '简体中文', value: 'zh-CN', flag: '🇨🇳' },
  { label: '繁體中文', value: 'zh-TW', flag: '🇭🇰' },
  { label: 'English', value: 'en', flag: '🇺🇸' },
  { label: '日本語', value: 'ja', flag: '🇯🇵' },
  { label: 'Deutsch', value: 'de', flag: '🇩🇪' },
  { label: 'Español', value: 'es', flag: '🇪🇸' },
  { label: 'Français', value: 'fr', flag: '🇫🇷' },
  { label: 'Português', value: 'pt', flag: '🇵🇹' },
  { label: 'Русский', value: 'ru', flag: '🇷🇺' },
];

// 默认语言
export const DEFAULT_LOCALE: LocaleCode = 'zh-CN';

// 扁平化嵌套对象为 dot notation 键
function flattenMessages(messages: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(messages)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      result[fullKey] = value;
    } else if (value !== null && typeof value === 'object') {
      Object.assign(result, flattenMessages(value as Record<string, unknown>, fullKey));
    }
  }

  return result;
}

// 语言消息缓存（扁平的）
const localeMessages: Record<LocaleCode, Record<string, string>> = {
  'zh-CN': {},
  'zh-TW': {},
  en: {},
  ja: {},
  de: {},
  es: {},
  fr: {},
  pt: {},
  ru: {},
};

// 当前语言
let currentLocale: LocaleCode = DEFAULT_LOCALE;

// 加载语言消息
export async function loadLocaleMessages(locale: LocaleCode): Promise<void> {
  if (Object.keys(localeMessages[locale]).length > 0) {
    return; // 已加载
  }

  try {
    let messages: Record<string, unknown>;
    switch (locale) {
      case 'zh-CN':
        messages = (await import('../locales/zh-CN')).default;
        break;
      case 'zh-TW':
        messages = (await import('../locales/zh-TW')).default;
        break;
      case 'en':
        messages = (await import('../locales/en')).default;
        break;
      case 'ja':
        messages = (await import('../locales/ja')).default;
        break;
      case 'de':
        messages = (await import('../locales/de')).default;
        break;
      case 'es':
        messages = (await import('../locales/es')).default;
        break;
      case 'fr':
        messages = (await import('../locales/fr')).default;
        break;
      case 'pt':
        messages = (await import('../locales/pt')).default;
        break;
      case 'ru':
        messages = (await import('../locales/ru')).default;
        break;
      default:
        messages = {};
    }
    // 扁平化嵌套消息
    localeMessages[locale] = flattenMessages(messages);
  } catch (error) {
    console.error(`Failed to load locale messages for ${locale}:`, error);
  }
}

// 设置当前语言
export async function setLocale(locale: LocaleCode): Promise<void> {
  await loadLocaleMessages(locale);
  currentLocale = locale;
}

// 获取当前语言
export function getLocale(): LocaleCode {
  return currentLocale;
}

// 翻译函数
export function t(key: string, params?: Record<string, string | number>): string {
  const message = localeMessages[currentLocale]?.[key];
  if (!message) {
    // 返回 key 作为后备
    return key;
  }

  // 翻译函数 - 支持 {{paramName}} 和 {paramName} 两种格式
  if (params) {
    // 先替换 {{paramName}} 格式
    let result = message;
    result = result.replace(/\{\{(\w+)\}\}/g, (_, paramName) => {
      const value = params[paramName];
      if (value !== undefined) {
        return String(value);
      }
      return _;
    });
    // 再替换 {paramName} 格式
    result = result.replace(/\{(\w+)\}/g, (_, paramName) => {
      const value = params[paramName];
      if (value !== undefined) {
        return String(value);
      }
      return _;
    });
    return result;
  }

  return message;
}

// Vue 插件
export const i18n = {
  install(app: App) {
    // 提供全局 $t 函数
    app.config.globalProperties.$t = t;

    // 提供 composable
    app.provide('t', t);
    app.provide('locale', currentLocale);
    app.provide('setLocale', setLocale);
    app.provide('getLocale', getLocale);
  },
};

// 响应式语言状态（用于 Vue 组件）
import { reactive } from 'vue';

export const localeState = reactive({
  locale: DEFAULT_LOCALE as LocaleCode,
  setLocale: async (locale: LocaleCode) => {
    await setLocale(locale);
    localeState.locale = locale;
  },
});
