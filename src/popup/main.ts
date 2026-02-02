/**
 * TabDav Popup 入口
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
// 导入全局样式，Vite 会将其编译到 JS 中
import '../styles/global.css';
// 初始化主题管理器
import { themeManager } from '../common/services/themeService';
// 初始化语言设置
import { setLocale, i18n } from '../common/i18n';
import { settingsService } from '../common/services/settingsService';

// 等待所有初始化完成后再启动应用
async function initApp(): Promise<void> {
  try {
    // 并行初始化主题和语言
    const [language] = await Promise.all([settingsService.getLanguage(), themeManager.init()]);
    await setLocale(language as any);
  } catch (error) {
    // Popup initialization failed silently
  }
}

// 等待初始化完成后创建Vue应用
initApp().then(() => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(i18n); // 注册 i18n 插件
  app.mount('#app');
});
