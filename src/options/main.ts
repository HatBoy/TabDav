/**
 * TabDav Options 入口
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
// 导入全局样式
import '../styles/global.css';
// 初始化主题管理器
import { themeManager } from '../common/services/themeService';
// 初始化语言设置
import { setLocale, i18n, t } from '../common/i18n';
import { settingsService } from '../common/services/settingsService';

async function initApp(): Promise<void> {
  // 初始化主题
  themeManager.init();

  // 初始化语言
  const language = await settingsService.getLanguage();
  await setLocale(language as any);

  // 根据语言设置页面标题
  document.title = t('options.title');
}

initApp().then(() => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(i18n); // 注册 i18n 插件
  app.mount('#app');
});
